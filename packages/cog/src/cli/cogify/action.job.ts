import { EPSG, QuadKey, TileCover } from '@basemaps/geo';
import { FileConfig, FileOperator, FileOperatorS3, LogConfig } from '@basemaps/lambda-shared';
import { CogSource } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogSourceFile } from '@cogeotiff/source-file';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { createReadStream, promises as fs } from 'fs';
import { basename } from 'path';
import * as ulid from 'ulid';
import { CogBuilder } from '../../cog/builder';
import { getTileSize } from '../../cog/cog';
import { buildVrtForTiffs, VrtOptions } from '../../cog/cog.vrt';
import { Cutline } from '../../cog/cutline';
import { CogJob } from '../../cog/types';
import { GdalCogBuilderDefaults, GdalResamplingOptions } from '../../gdal/gdal.config';
import { getJobPath, makeTempFolder } from '../folder';
import { ActionBatchJob } from './action.batch';

function filterTiff(a: string): boolean {
    const lowerA = a.toLowerCase();
    return lowerA.endsWith('.tiff') || lowerA.endsWith('.tif');
}

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

    MaxCogsDefault = 50;
    MaxConcurrencyDefault = 5;
    MinZoomDefault = 1;

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
        const imageryName = basename(this.source?.path.value ?? '').replace(/\./g, '-'); // batch does not allow '.' in names
        const processId = this.overrideId?.value ?? ulid.ulid();

        const logger = LogConfig.get().child({ id: processId, imageryName });
        LogConfig.set(logger);

        // Make typescript happy with all the undefined
        if (this.source == null || this.output == null) {
            throw new Error('Failed to read parameters');
        }

        logger.info({ source: this.source.path.value, sourceRole: this.source.roleArn.value }, 'ListTiffs');
        const sourceConfig = this.fsConfig(this.source);
        const outputConfig = this.fsConfig(this.output);
        const sourceFs = FileOperator.create(sourceConfig);
        const outputFs = FileOperator.create(outputConfig);
        const tiffList = (await sourceFs.list(sourceConfig.path)).filter(filterTiff);

        let tiffSource: CogSource[];
        if (sourceFs instanceof FileOperatorS3) {
            tiffSource = tiffList.map((path) => {
                const { bucket, key } = FileOperatorS3.parse(path);
                // Use the same s3 credentials to access the files that were used to list them
                return new CogSourceAwsS3(bucket, key, sourceFs.s3);
            });
        } else {
            tiffSource = tiffList.map((path) => new CogSourceFile(path));
        }
        const maxConcurrency = this.maxConcurrency?.value ?? this.MaxConcurrencyDefault;

        logger.info({ source: this.source.path.value, tiffCount: tiffList.length }, 'LoadingTiffs');

        const cutlineDefaults = Cutline.defaultCutline(imageryName);
        const cutlinePath =
            this.cutline?.value == null
                ? outputConfig.path + Cutline.defaultCutline(imageryName)['path']
                : this.cutline.value;
        const cutline = cutlinePath == null ? new Cutline() : await Cutline.loadCutline(cutlinePath);

        const blend = this.cutlineBlend == null ? cutlineDefaults['blend'] : this.cutlineBlend?.value;

        const builder = new CogBuilder(maxConcurrency, logger);
        const metadata = await builder.build(tiffSource, cutline);

        const quadkeys = Array.from(metadata.covering).sort(QuadKey.compareKeys);
        if (quadkeys.length > 0) {
            const firstQk = quadkeys[0];
            const lastQk = quadkeys[quadkeys.length - 1];
            logger.info(
                {
                    // Size of the biggest image
                    big: getTileSize(firstQk, metadata.resolution),
                    // Size of the smallest image
                    small: getTileSize(lastQk, metadata.resolution),
                },
                'Covers',
            );
        }

        // Don't log bounds as it is huge
        logger.info(
            {
                ...metadata,
                bounds: undefined,
                covering: undefined,
                quadKeyCount: quadkeys.length,
                quadkeys: quadkeys.join(' '),
            },
            'CoveringGenerated',
        );

        const vrtOptions: VrtOptions = { addAlpha: true, forceEpsg3857: true };
        // -addalpha to vrt adds extra alpha layers even if one already exist
        if (metadata.bands > 3) {
            logger.warn({ bandCount: metadata.bands }, 'Vrt:DetectedAlpha, Disabling -addalpha');
            vrtOptions.addAlpha = false;
        }

        // If the source imagery is in 900931, no need to force a warp
        if (metadata.projection == EPSG.Google) {
            logger.warn({ bandCount: metadata.bands }, 'Vrt:GoogleProjection, Disabling warp');
            vrtOptions.forceEpsg3857 = false;
        }
        const resampling =
            this.resampling?.value == null
                ? GdalCogBuilderDefaults.resampling
                : GdalResamplingOptions[this.resampling?.value];

        if (resampling == null) {
            const options = Object.keys(GdalResamplingOptions).join(', ');
            throw new Error(`Invalid resampling method: "${this.resampling?.value} options: ${options}`);
        }

        const job: CogJob = {
            id: processId,
            name: imageryName,
            projection: EPSG.Google,
            output: {
                ...outputConfig,
                resampling,
                quality: this.quality.value ?? 90,
                cutlineBlend: cutline != null ? blend ?? 0 : undefined,
                nodata: metadata.nodata,
                vrt: {
                    options: vrtOptions,
                },
            },
            source: {
                ...sourceConfig,
                resolution: metadata.resolution,
                files: tiffList,
                options: { maxConcurrency },
            },
            quadkeys,
        };

        const isVrtGenerated = this.generateVrt?.value == true;
        const tmpFolder = await makeTempFolder(`basemaps-${job.id}`);
        try {
            // Local file systems need directories to be created before writing to them
            if (!FileOperatorS3.isS3(outputFs)) {
                await fs.mkdir(getJobPath(job), { recursive: true });
            }

            // TODO should this be done here, it could be done for each COG builder
            if (isVrtGenerated) {
                const vrtTmp = await buildVrtForTiffs(job, vrtOptions, tmpFolder, logger);
                const readStream = createReadStream(vrtTmp);
                await outputFs.write(getJobPath(job, '.vrt'), readStream, logger);
            }

            const jobFile = getJobPath(job, `job.json`);
            await outputFs.writeJson(jobFile, job, logger);

            if (cutline != null) {
                const geoJsonCutlineOutput = getJobPath(job, `cutline.geojson.gz`);
                await outputFs.writeJson(geoJsonCutlineOutput, cutline.toGeoJson(), logger);
            }

            const geoJsonSourceOutput = getJobPath(job, `source.geojson`);
            await outputFs.writeJson(geoJsonSourceOutput, metadata.bounds, logger);

            const geoJsonCoveringOutput = getJobPath(job, `covering.geojson`);
            await outputFs.writeJson(geoJsonCoveringOutput, TileCover.toGeoJson(quadkeys), logger);

            if (this.submitBatch.value) {
                if (!isVrtGenerated) throw new Error('Unable to submit, no VRT generated');
                await ActionBatchJob.batchJob(jobFile, true, logger);
            }

            logger.info({ job: jobFile }, 'Done');
        } finally {
            // Cleanup
            await fs.rmdir(tmpFolder, { recursive: true });
        }
    }

    protected onDefineParameters(): void {
        this.source = new CLiInputData(this, 'source');
        this.output = new CLiInputData(this, 'output');

        this.maxConcurrency = this.defineIntegerParameter({
            argumentName: 'MAX_CONCURRENCY',
            parameterLongName: '--concurrency',
            parameterShortName: '-c',
            description: 'Maximum number of requests to use at one time',
            defaultValue: this.MaxConcurrencyDefault,
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
    }
}
