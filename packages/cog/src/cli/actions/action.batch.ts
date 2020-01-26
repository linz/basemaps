import { Env, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@microsoft/ts-command-line';
import * as aws from 'aws-sdk';
import * as path from 'path';
import * as ulid from 'ulid';
import { CogJob } from '../../cog';
import { FileOperator } from '../../file/file';

export class ActionBatchJob extends CommandLineAction {
    private job?: CommandLineStringParameter;
    private region?: CommandLineStringParameter;
    private queue?: CommandLineStringParameter;
    private commit?: CommandLineFlagParameter;

    public constructor() {
        super({
            actionName: 'batch',
            summary: 'AWS batch jobs',
            documentation: 'Submit a list of cogs to a AWS Batch queue to be process',
        });
    }

    async onExecute(): Promise<void> {
        if (this.job?.value == null) {
            throw new Error('Failed to read parameters');
        }
        const region = this.region?.value ?? Env.get('AWS_DEFAULT_REGION', 'ap-southeast-2');
        const jobData = await FileOperator.create(this.job.value).read(this.job.value);
        const job = JSON.parse(jobData.toString()) as CogJob;
        const processId = ulid.ulid();
        const logger = LogConfig.get().child({ id: processId, correlationId: job.id });
        LogConfig.set(logger);

        const isCommit = this.commit?.value ?? false;

        const batch = new aws.Batch({ region });
        const lastFolderName = path.basename(job.source.path);
        const jobName = `Cog-${lastFolderName.replace('.', '_')}`;
        const jobQueue = 'CogBatchJobQueue';
        const jobDefinition = 'CogBatchJob';
        logger.info({ jobs: job.quadkeys.length, jobName, jobQueue, jobDefinition }, 'JobSubmit');

        if (!isCommit) {
            return;
        }
        // TODO these names are taken from the deployment script maybe they should be looked up
        const batchJob = await batch
            .submitJob({
                jobName,
                jobQueue,
                jobDefinition,
                arrayProperties: { size: job.quadkeys.length },
                containerOverrides: {
                    command: ['-V', 'cog', '--job', this.job.value, '--commit'],
                },
            })
            .promise();

        logger.info({ batch: batchJob }, 'JobSubmitted');
    }

    protected onDefineParameters(): void {
        this.job = this.defineStringParameter({
            argumentName: 'JOB',
            parameterLongName: '--job',
            description: 'Job config source to access',
            required: true,
        });

        this.queue = this.defineStringParameter({
            argumentName: 'QUEUE',
            parameterLongName: '--queue',
            description: 'AWS Batch Queue to use',
            required: false,
        });

        this.region = this.defineStringParameter({
            argumentName: 'REGION',
            parameterLongName: '--region',
            description: 'AWS region to use, defaults to $AWS_DEFAULT_REGION',
            required: false,
        });

        this.commit = this.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Begin the transformation',
            required: false,
        });
    }
}
