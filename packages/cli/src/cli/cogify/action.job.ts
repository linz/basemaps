import { Epsg, EpsgCode } from '@basemaps/geo';
import { FileConfig, FileOperator, ProjectionTileMatrixSet, FileConfigPath } from '@basemaps/shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { CogJobFactory, JobCreationContext, MaxConcurrencyDefault } from '../../cog/job';
import { GdalCogBuilderDefaults, GdalCogBuilderResampling, GdalResamplingOptions } from '../../gdal/gdal.config';
import { CliId } from '../base.cli';

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
    private cutline: CommandLineStringParameter;
    private cutlineBlend: CommandLineIntegerParameter;
    private overrideId: CommandLineStringParameter;
    private overrideWarpReample: CommandLineStringParameter;
    private submitBatch: CommandLineFlagParameter;
    private quality: CommandLineIntegerParameter;
    private sourceProjection: CommandLineIntegerParameter;
    private targetProjection: CommandLineIntegerParameter;
    private oneCog: CommandLineFlagParameter;
    private fileList: CommandLineStringParameter;

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
        return {
            path: source.path.value,
            type: 's3',
            roleArn: source.roleArn.value,
            externalId: source.externalId.value,
        };
    }

    async onExecute(): Promise<void> {
        const source: FileConfig | FileConfigPath = this.fsConfig(this.source);
        const output = this.fsConfig(this.output);

        let cutline = undefined;
        if (this.cutline?.value) {
            cutline = { source: this.cutline.value, blend: this.cutlineBlend.value ?? 20 };
        }

        const targetProjection = ProjectionTileMatrixSet.tryGet(this.targetProjection?.value);
        if (targetProjection == null) throw new Error('Invalid target-projection');

        let resampling: GdalCogBuilderResampling | undefined;

        if (this.overrideWarpReample?.value != null) {
            const warp = GdalResamplingOptions[this.overrideWarpReample?.value];
            if (warp == null) {
                throw new Error('Invalid override-warp-resampling');
            }
            resampling = {
                warp,
                overview: 'lanczos',
            };
        }

        const fileListPath = this.fileList?.value;
        if (fileListPath != null) {
            const fileData = await FileOperator.create(fileListPath).read(fileListPath);
            (source as FileConfigPath).files = fileData
                .toString()
                .trim()
                .split('\n')
                .map((fn) => source.path + '/' + fn);
        }

        const ctx: JobCreationContext = {
            source,
            output,
            cutline,
            targetProjection,
            override: {
                concurrency: this.maxConcurrency?.value ?? MaxConcurrencyDefault,
                quality: this.quality?.value ?? GdalCogBuilderDefaults.quality,
                id: this.overrideId?.value ?? CliId,
                projection: Epsg.tryGet(this.sourceProjection?.value),
                resampling,
            },
            batch: this.submitBatch?.value ?? false,
            oneCog: this.oneCog?.value ?? false,
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
            description: 'create job with a pre determined job id',
            required: false,
        });

        this.overrideWarpReample = this.defineStringParameter({
            argumentName: 'METHOD',
            parameterLongName: '--override-warp-resampling',
            description: 'Defaults to bilinear. Common options are: nearest, lanczos, cubic',
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

        this.targetProjection = this.defineIntegerParameter({
            argumentName: 'TARGET_PROJECTION',
            parameterLongName: '--target-projection',
            description: 'The EPSG code for the target imagery',
            defaultValue: EpsgCode.Google,
            required: false,
        });

        this.oneCog = this.defineFlagParameter({
            parameterLongName: '--one-cog',
            description: 'ignore target projection window and just produce one big COG.',
            required: false,
        });

        this.fileList = this.defineStringParameter({
            argumentName: 'FILE_LIST',
            parameterLongName: '--filelist',
            description: 'supply a list of files to use as source imagery',
            required: false,
        });
    }
}
