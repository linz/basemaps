import {
    Env,
    FileOperator,
    LogConfig,
    TileMetadataTable,
    RecordPrefix,
    Aws,
    TileMetadataImageryRecord,
    TileMetadataSetRecord,
    LogType,
} from '@basemaps/lambda-shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import * as aws from 'aws-sdk';
import { CogJob } from '../../cog/types';
import { getJobPath } from '../folder';
import { EPSG } from '@basemaps/geo';

const JobQueue = 'CogBatchJobQueue';
const JobDefinition = 'CogBatchJob';

/** The base alignment level used by GDAL, Tiffs that are bigger or smaller than this should scale the compute resources */
const MagicAlignmentLevel = 7;

/**
 * Attempt to parse a year from a imagery name
 * @example wellington_urban_2017_0.10m -> 2017
 * @param name Imagery name to parse
 * @return imagery year, -1 for failure to parse
 */
export function extractYearFromName(name: string): number {
    const re = /(?:^|\D)(\d{4})(?:$|\D)/g;

    let year = -1;

    for (let m = re.exec(name); m != null; m = re.exec(name)) {
        const t = parseInt(m[1]);
        if (t > year) year = t;
    }

    return year;
}

const ResolutionRegex = /((?:\d[\.\-])?\d+)m/;
/**
 * Attempt to parse a resolution from a imagery name
 * @example `wellington_urban_2017_0.10m` -> 100
 * @param name Imagery name to parse
 * @returns resolution (millimeters), -1 for failure to parse
 */
export function extractResolutionFromName(name: string): number {
    const matches = name.match(ResolutionRegex);
    if (matches == null) return -1;
    return parseFloat(matches[1].replace('-', '.')) * 1000;
}

export function createImageryRecordFromJob(job: CogJob): TileMetadataImageryRecord {
    const now = Date.now();

    return {
        id: TileMetadataTable.prefix(RecordPrefix.Imagery, job.id),
        name: job.name,
        createdAt: now,
        updatedAt: now,
        projection: job.projection ?? EPSG.Google, // TODO a lot of old imagery does not have this value set.
        year: extractYearFromName(job.name),
        resolution: extractResolutionFromName(job.name),
        quadKeys: job.quadkeys,
    };
}

export class ActionBatchJob extends CommandLineAction {
    private job?: CommandLineStringParameter;
    private commit?: CommandLineFlagParameter;

    public constructor() {
        super({
            actionName: 'batch',
            summary: 'AWS batch jobs',
            documentation: 'Submit a list of cogs to a AWS Batch queue to be process',
        });
    }

    static id(job: CogJob, quadKey: string): string {
        return `${job.id}-${job.name}-${quadKey}`;
    }

    static async batchOne(
        jobPath: string,
        job: CogJob,
        batch: AWS.Batch,
        quadKey: string,
        isCommit: boolean,
    ): Promise<{ jobName: string; jobId: string; memory: number }> {
        const jobName = ActionBatchJob.id(job, quadKey);
        const alignmentLevels = job.source.resolution - quadKey.length;
        // Give 25% more memory to larger jobs
        const resDiff = 1 + Math.max(alignmentLevels - MagicAlignmentLevel, 0) * 0.25;
        const memory = 3900 * resDiff;

        if (!isCommit) {
            return { jobName, jobId: '', memory };
        }

        const commandStr = ['-V', 'cog', '--job', jobPath, '--commit', '--quadkey', quadKey];

        const batchJob = await batch
            .submitJob({
                jobName,
                jobQueue: JobQueue,
                jobDefinition: JobDefinition,
                containerOverrides: {
                    memory,
                    command: commandStr,
                },
                retryStrategy: { attempts: 3 },
            })
            .promise();
        return { jobName, jobId: batchJob.jobId, memory };
    }

    /**
     * List all the current jobs in batch and their statuses
     * @returns a map of JobName to if their status is "ok" (not failed)
     */
    static async getCurrentJobList(batch: AWS.Batch): Promise<Map<string, boolean>> {
        // For some reason AWS only lets us query one status at a time.
        const allStatuses = ['SUBMITTED', 'PENDING', 'RUNNABLE', 'STARTING', 'RUNNING', 'SUCCEEDED', 'FAILED'];
        const allJobs = await Promise.all(
            allStatuses.map((jobStatus) => batch.listJobs({ jobQueue: JobQueue, jobStatus }).promise()),
        );

        const okMap = new Map<string, boolean>();

        for (const status of allJobs) {
            for (const job of status.jobSummaryList) {
                if (job.status == 'FAILED' && okMap.get(job.jobName) != true) {
                    okMap.set(job.jobName, false);
                } else {
                    okMap.set(job.jobName, true);
                }
            }
        }
        return okMap;
    }

    async onExecute(): Promise<void> {
        if (this.job?.value == null) {
            throw new Error('Failed to read parameters');
        }

        await ActionBatchJob.batchJob(this.job.value, this.commit?.value, LogConfig.get());
    }

    static async batchJob(jobPath: string, commit = false, logger: LogType): Promise<void> {
        if (!FileOperator.isS3(jobPath)) throw new Error(`AWS Batch job.json have to be in S3, jobPath:${jobPath}`);
        const job = (await FileOperator.create(jobPath).readJson(jobPath)) as CogJob;
        LogConfig.set(logger.child({ correlationId: job.id, imageryName: job.name }));

        const region = Env.get('AWS_DEFAULT_REGION', 'ap-southeast-2');
        const batch = new aws.Batch({ region });

        const outputFs = FileOperator.create(job.output);
        const runningJobs = await ActionBatchJob.getCurrentJobList(batch);

        const stats = await Promise.all(
            job.quadkeys.map(async (quadKey) => {
                const jobName = ActionBatchJob.id(job, quadKey);
                const isRunning = runningJobs.get(jobName);
                if (isRunning) {
                    logger.info({ jobName }, 'JobRunning');
                    return { quadKey, ok: true };
                }

                const targetPath = getJobPath(job, `${quadKey}.tiff`);
                const exists = await outputFs.exists(targetPath);
                if (exists) {
                    logger.info({ targetPath }, 'FileExists');
                }
                return { quadKey, ok: exists };
            }),
        );

        const toSubmit = stats.filter((f) => f.ok == false).map((c) => c.quadKey);
        if (toSubmit.length == 0) {
            logger.info('NoJobs');
            return;
        }

        logger.info(
            {
                jobTotal: job.quadkeys.length,
                jobLeft: toSubmit.length,
                jobQueue: JobQueue,
                jobDefinition: JobDefinition,
            },
            'JobSubmit',
        );

        if (commit) {
            const img = createImageryRecordFromJob(job);
            await Aws.tileMetadata.put(img);
            const tileMetadata: TileMetadataSetRecord = {
                id: '',
                // TODO this name is not super nice, ideally we should use the simplified image name
                name: job.id,
                projection: job.projection,
                version: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                imagery: { [img.id]: { id: img.id, minZoom: 0, maxZoom: 32, priority: 10 } },
            };
            await Aws.tileMetadata.TileSet.create(tileMetadata);
        }

        for (const quadKey of toSubmit) {
            const jobStatus = await ActionBatchJob.batchOne(jobPath, job, batch, quadKey, commit);
            logger.info(jobStatus, 'JobSubmitted');
        }

        if (!commit) {
            logger.warn('DryRun:Done');
            return;
        }
    }

    protected onDefineParameters(): void {
        this.job = this.defineStringParameter({
            argumentName: 'JOB',
            parameterLongName: '--job',
            description: 'Job config source to access',
            required: true,
        });

        this.commit = this.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Begin the transformation',
            required: false,
        });
    }
}
