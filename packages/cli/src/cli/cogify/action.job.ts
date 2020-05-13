import { FileConfig, FileOperator } from '@basemaps/lambda-shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import * as ulid from 'ulid';
import { CogJobFactory, JobCreationContext, MaxConcurrencyDefault } from '../../cog/job';
import { GdalCogBuilderDefaults, GdalResamplingOptions } from '../../gdal/gdal.config';

export class CLiInputData {
    path: CommandLineStringParameter;
    roleArn: CommandLineStringParameter;
    externalId: CommandLineStringParameter;

    constructor(parent: CommandLineAction, prefix: string) {
        this.path = parent.defineStringParameter({
            argumentName: prefix.toUpperCase(),
            parameterLongName: `--${prefix}`,
            description: 'Folder or S3 Bucket location to use',
            required: true,
        });

        this.roleArn = parent.defineStringParameter({
            argumentName: prefix.toUpperCase() + '_ARN',
            parameterLongName: `--${prefix}-role-arn`,
            description: 'Role to be assumed to access the data',
            required: false,
        });

        this.externalId = parent.defineStringParameter({
            argumentName: prefix.toUpperCase() + '_EXTERNAL_ID',
            parameterLongName: `--${prefix}-role-external-id`,
            description: 'Role external id to be assumed to access the data',
            required: false,
        });
    }
}

export class ActionJobCreate extends CommandLineAction {
    private source: CLiInputData;
    private output: CLiInputData;
    private maxConcurrency: CommandLineIntegerParameter;
    private generateVrt: CommandLineFlagParameter;
    private resampling: CommandLineStringParameter;
    private cutline: CommandLineStringParameter;
    private cutlineBlend: CommandLineIntegerParameter;
    private overrideId: CommandLineStringParameter;
    private submitBatch: CommandLineFlagParameter;
    private quality: CommandLineIntegerParameter;
    private sourceProjection: CommandLineIntegerParameter;

    public constructor() {
        super({
            actionName: 'job',
            summary: 'create a list of cogs that need to be processed',
            documentation: 'List a folder/bucket full of cogs and determine a optimal processing pipeline',
        });
    }

    fsConfig(source: CLiInputData): FileConfig {
        if (source.path.value == null) {
            throw new Error('Invalid path');
        }
        if (!FileOperator.isS3(source.path.value)) {
            return { type: 'local', path: source.path.value };
        }
        if (source.roleArn.value == null) {
            return { type: 's3', path: source.path.value };
        }
        if (source.externalId.value == null) {
            throw new Error('External Id is required if roleArn is provided.');
        }
        return {
            path: source.path.value,
            type: 's3',
            roleArn: source.roleArn.value,
            externalId: source.externalId.value,
        };
    }

    async onExecute(): Promise<void> {
        const source = this.fsConfig(this.source);
        const output = this.fsConfig(this.output);

        let cutline = undefined;
        if (this.cutline?.value) {
            cutline = { path: this.cutline.value, blend: this.cutlineBlend.value ?? 20 };
        }
        const resampling =
            this.resampling?.value == null
                ? GdalCogBuilderDefaults.resampling
                : GdalResamplingOptions[this.resampling?.value];

        const ctx: JobCreationContext = {
            source,
            output,
            cutline,
            override: {
                concurrency: this.maxConcurrency?.value ?? MaxConcurrencyDefault,
                quality: this.quality?.value ?? GdalCogBuilderDefaults.quality,
                id: this.overrideId?.value ?? ulid.ulid(),
                projection: this.sourceProjection?.value,
                resampling,
            },
            batch: this.submitBatch?.value,
            generateVrt: this.generateVrt?.value,
        };

        await CogJobFactory.create(ctx);
    }

    protected onDefineParameters(): void {
        this.source = new CLiInputData(this, 'source');
        this.output = new CLiInputData(this, 'output');

        this.maxConcurrency = this.defineIntegerParameter({
            argumentName: 'MAX_CONCURRENCY',
            parameterLongName: '--concurrency',
            parameterShortName: '-c',
            description: 'Maximum number of requests to use at one time',
            defaultValue: MaxConcurrencyDefault,
            required: false,
        });

        this.generateVrt = this.defineFlagParameter({
            parameterLongName: '--vrt',
            description: 'Generate the source vrt for the COGs',
            required: false,
        });

        this.resampling = this.defineStringParameter({
            argumentName: 'RESAMPLING',
            parameterLongName: '--resampling',
            description: 'Resampling method to use',
            required: false,
        });

        this.cutline = this.defineStringParameter({
            argumentName: 'CUTLINE',
            parameterLongName: '--cutline',
            description: 'use a shapefile to crop the COGs',
            required: false,
        });

        this.cutlineBlend = this.defineIntegerParameter({
            argumentName: 'CUTLINE_BLEND',
            parameterLongName: '--cblend',
            description: 'Set a blend distance to use to blend over cutlines (in pixels)',
            required: false,
        });

        this.overrideId = this.defineStringParameter({
            argumentName: 'OVERRIDE_ID',
            parameterLongName: '--override-id',
            description: 'used mainly for debugging to create with a pre determined job id',
            required: false,
        });

        this.submitBatch = this.defineFlagParameter({
            parameterLongName: `--batch`,
            description: 'Submit the job to AWS Batch',
            required: false,
        });

        this.quality = this.defineIntegerParameter({
            argumentName: 'QUALITY',
            parameterLongName: '--quality',
            description: 'Compression quality (0-100)',
            required: false,
        });

        this.sourceProjection = this.defineIntegerParameter({
            argumentName: 'SOURCE_PROJECTION',
            parameterLongName: '--source-projection',
            description: 'The EPSG code of the source imagery',
            required: false,
        });
    }
}
