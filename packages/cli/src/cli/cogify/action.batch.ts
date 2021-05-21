import { ConfigTileSetRaster, TileSetType } from '@basemaps/config';
import { EpsgCode, TileMatrixSet } from '@basemaps/geo';
import { Config, Env, FileOperator, LogConfig, LogType, Projection } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import Batch from 'aws-sdk/clients/batch';
import { CogStacJob } from '../../cog/cog.stac.job';
import { CogJob } from '../../cog/types';

const JobQueue = 'CogBatchJobQueue';
const JobDefinition = 'CogBatchJob';

/** The base alignment level used by GDAL, Tiffs that are bigger or smaller than this should scale the compute resources */
const MagicAlignmentLevel = 7;

const ResolutionRegex = /((?:\d[\.\-])?\d+)m/;

const ValidProjections = new Set([EpsgCode.Google, EpsgCode.Nztm2000]);

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

export async function createImageryTileSet(job: CogJob): Promise<void> {
    const projection = job.tileMatrix.projection.code;
    if (!ValidProjections.has(projection)) throw new Error(`Projection: ${projection} not support.`);
    const now = Date.now();

    const tileSet: ConfigTileSetRaster = {
        type: TileSetType.Raster,
        createdAt: now,
        updatedAt: now,
        id: Config.TileSet.id(job.id),
        name: job.id,
        layers: [
            {
                [projection]: Config.prefix(Config.Prefix.Imagery, job.id),
                name: job.name,
                minZoom: 0,
                maxZoom: 32,
            },
        ],
        title: job.title,
        description: job.description,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
    };

    await Config.TileSet.put(tileSet);
}

export class ActionBatchJob extends CommandLineAction {
    private job?: CommandLineStringParameter;
    private commit?: CommandLineFlagParameter;
    private oneCog?: CommandLineStringParameter;

    public constructor() {
        super({
            actionName: 'batch',
            summary: 'AWS batch jobs',
            documentation: 'Submit a list of cogs to a AWS Batch queue to be process',
        });
    }

    static id(job: CogJob, name: string): string {
        return `${job.id}-${job.name}-${name}`;
    }

    static async batchOne(
        jobPath: string,
        job: CogJob,
        batch: Batch,
        name: string,
        isCommit: boolean,
    ): Promise<{ jobName: string; jobId: string; memory: number }> {
        const jobName = ActionBatchJob.id(job, name);
        const tile = TileMatrixSet.nameToTile(name);
        const alignmentLevels = Projection.findAlignmentLevels(job.tileMatrix, tile, job.source.gsd);
        // Give 25% more memory to larger jobs
        const resDiff = 1 + Math.max(alignmentLevels - MagicAlignmentLevel, 0) * 0.25;
        const memory = 3900 * resDiff;

        if (!isCommit) {
            return { jobName, jobId: '', memory };
        }

        const commandStr = ['-V', 'cog', '--job', jobPath, '--commit', '--name', name];

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
    static async getCurrentJobList(batch: Batch): Promise<Map<string, boolean>> {
        // For some reason AWS only lets us query one status at a time.
        const allStatuses = ['SUBMITTED', 'PENDING', 'RUNNABLE', 'STARTING', 'RUNNING', 'SUCCEEDED', 'FAILED'];
        const allJobs = await Promise.all(
            allStatuses.map((jobStatus) => batch.listJobs({ jobQueue: JobQueue, jobStatus }).promise()),
        );

        const okMap = new Map<string, boolean>();

        for (const status of allJobs) {
            for (const job of status.jobSummaryList) {
                if (job.status === 'FAILED' && okMap.get(job.jobName) !== true) {
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

        await ActionBatchJob.batchJob(
            await CogStacJob.load(this.job.value),
            this.commit?.value,
            this.oneCog?.value,
            LogConfig.get(),
        );
    }

    static async batchJob(job: CogJob, commit = false, oneCog: string | undefined, logger: LogType): Promise<void> {
        const jobPath = job.getJobPath('job.json');
        if (!FileOperator.isS3(jobPath)) {
            throw new Error(`AWS Batch collection.json have to be in S3, jobPath:${jobPath}`);
        }
        LogConfig.set(logger.child({ correlationId: job.id, imageryName: job.name }));

        const region = Env.get('AWS_DEFAULT_REGION') ?? 'ap-southeast-2';
        const batch = new Batch({ region });

        const outputFs = FileOperator.create(job.output.location);
        const runningJobs = await ActionBatchJob.getCurrentJobList(batch);

        const stats = await Promise.all(
            job.output.files.map(async ({ name }) => {
                if (oneCog != null && oneCog !== name) return { name, ok: true };
                const jobName = ActionBatchJob.id(job, name);
                const isRunning = runningJobs.get(jobName);
                if (isRunning) {
                    logger.info({ jobName }, 'JobRunning');
                    return { name, ok: true };
                }

                const targetPath = job.getJobPath(`${name}.tiff`);
                const exists = await outputFs.exists(targetPath);
                if (exists) {
                    logger.info({ targetPath }, 'FileExists');
                }
                return { name, ok: exists };
            }),
        );

        const toSubmit = stats.filter((f) => f.ok === false).map((c) => c.name);
        if (toSubmit.length === 0) {
            logger.info('NoJobs');
            return;
        }

        logger.info(
            {
                jobTotal: job.output.files.length,
                jobLeft: toSubmit.length,
                jobQueue: JobQueue,
                jobDefinition: JobDefinition,
            },
            'JobSubmit',
        );

        if (commit) await createImageryTileSet(job);

        for (const name of toSubmit) {
            const jobStatus = await ActionBatchJob.batchOne(jobPath, job, batch, name, commit);
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

        this.oneCog = this.defineStringParameter({
            argumentName: 'COG_NAME',
            parameterLongName: '--one-cog',
            description: 'Restrict batch to build a single COG file',
            required: false,
        });

        this.commit = this.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Begin the transformation',
            required: false,
        });
    }
}
