import { Env, FileOperator, LogConfig, TileMetadataTable } from '@basemaps/lambda-shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import * as aws from 'aws-sdk';
import * as ulid from 'ulid';
import { CogJob } from '../../cog/cog';
import { getJobPath } from '../folder';
const JobQueue = 'CogBatchJobQueue';
const JobDefinition = 'CogBatchJob';

/** The base alignment level used by GDAL, Tiffs that are bigger or smaller than this should scale the compute resources */
const MagicAlignmentLevel = 7;

export function extractYearFromName(name: string): number {
    const re = /(?:^|\D)(\d{4})(?:$|\D)/g;

    let year = -1;

    for (let m = re.exec(name); m != null; m = re.exec(name)) {
        const t = parseInt(m[1]);
        if (t > year) year = t;
    }

    return year;
}

export function storeImage(job: CogJob): Promise<string> {
    const now = Date.now();
    return new TileMetadataTable().create({
        id: `im_${job.id}`,
        name: job.name,
        createdAt: now,
        updatedAt: now,
        projection: job.projection,
        year: extractYearFromName(job.name),
        resolution: job.source.resolution,
        quadKeys: job.quadkeys,
    });
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

    async batchOne(
        job: CogJob,
        batch: AWS.Batch,
        quadKey: string,
        isCommit: boolean,
    ): Promise<{ jobName: string; jobId: string; memory: number }> {
        const jobName = `Cog-${job.name}-${quadKey}`;

        const alignmentLevels = job.source.resolution - quadKey.length;
        // Give 25% more memory to larger jobs
        const resDiff = 1 + Math.max(alignmentLevels - MagicAlignmentLevel, 0) * 0.25;
        const memory = 3900 * resDiff;

        if (!isCommit || this.job?.value == null) {
            return { jobName, jobId: '', memory };
        }

        const commandStr = ['-V', 'cog', '--job', this.job.value, '--commit', '--quadkey', quadKey];

        const batchJob = await batch
            .submitJob({
                jobName,
                jobQueue: JobQueue,
                jobDefinition: JobDefinition,
                containerOverrides: {
                    memory,
                    command: commandStr,
                },
            })
            .promise();
        return { jobName, jobId: batchJob.jobId, memory };
    }

    async onExecute(): Promise<void> {
        if (this.job?.value == null) {
            throw new Error('Failed to read parameters');
        }
        const region = Env.get('AWS_DEFAULT_REGION', 'ap-southeast-2');
        const jobData = await FileOperator.create(this.job.value).read(this.job.value);
        const job = JSON.parse(jobData.toString()) as CogJob;
        const processId = ulid.ulid();
        const logger = LogConfig.get().child({ id: processId, correlationId: job.id, imageryName: job.name });
        LogConfig.set(logger);

        const isCommit = this.commit?.value ?? false;

        const outputFs = FileOperator.create(job.output);

        let isPartial = false;
        let todoCount = job.quadkeys.length;
        const stats = await Promise.all(
            job.quadkeys.map(async (quadKey) => {
                const targetPath = getJobPath(job, `${quadKey}.tiff`);
                const exists = await outputFs.exists(targetPath);
                if (exists) {
                    logger.debug({ targetPath }, 'FileExists');
                    isPartial = true;
                    todoCount--;
                }
                return { quadKey, exists };
            }),
        );

        logger.info(
            {
                jobTotal: job.quadkeys.length,
                jobLeft: todoCount,
                jobQueue: JobQueue,
                jobDefinition: JobDefinition,
                isPartial,
            },
            'JobSubmit',
        );

        if (isCommit) await storeImage(job);

        const batch = new aws.Batch({ region });
        const toSubmit = stats.filter((f) => f.exists == false).map((c) => c.quadKey);
        for (const quadKey of toSubmit) {
            const jobStatus = await this.batchOne(job, batch, quadKey, isCommit);
            logger.info(jobStatus, 'JobSubmitted');
        }

        if (!isCommit) {
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
