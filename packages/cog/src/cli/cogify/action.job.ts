import { EPSG } from '@basemaps/geo';
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
import { CogJob, getTileSize } from '../../cog/cog';
import { buildVrtForTiffs, VrtOptions } from '../../cog/cog.vrt';
import { TileCover } from '../../cog/cover';
import { getResample } from '../../gdal/gdal.config';
import { getJobPath, makeTempFolder } from '../folder';

const ProcessId = ulid.ulid();

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
    private source?: CLiInputData;
    private output?: CLiInputData;
    private minZoom?: CommandLineIntegerParameter;
    private maxCogs?: CommandLineIntegerParameter;
    private maxConcurrency?: CommandLineIntegerParameter;
    private generateVrt?: CommandLineFlagParameter;
    private resample?: CommandLineStringParameter;

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

        const logger = LogConfig.get().child({ id: ProcessId, imageryName });
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
        const maxCogs = this.maxCogs?.value ?? this.MaxCogsDefault;
        const minZoom = this.minZoom?.value ?? this.MinZoomDefault;

        logger.info({ source: this.source.path.value, tiffCount: tiffList.length }, 'LoadingTiffs');

        const builder = new CogBuilder(maxConcurrency, maxCogs, minZoom);
        const metadata = await builder.build(tiffSource, logger);

        // Don't log bounds as it is huge
        logger.info({ ...metadata, bounds: undefined }, 'CoveringGenerated');

        if (metadata.covering.length > 0) {
            const firstQk = metadata.covering[0];
            const lastQk = metadata.covering[metadata.covering.length - 1];
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
        const job: CogJob = {
            id: ProcessId,
            name: imageryName,
            projection: EPSG.Google,
            output: {
                ...outputConfig,
                resample: getResample(this.resample?.value),
                nodata: metadata.nodata,
                vrt: {
                    options: vrtOptions,
                },
            },
            source: {
                ...sourceConfig,
                resolution: metadata.resolution,
                files: tiffList,
                options: { maxConcurrency, maxCogs, minZoom },
            },
            quadkeys: metadata.covering,
        };

        const tmpFolder = await makeTempFolder(`basemaps-${job.id}`);
        try {
            // Local file systems need directories to be created before writing to them
            if (!FileOperatorS3.isS3(outputFs)) {
                await fs.mkdir(getJobPath(job), { recursive: true });
            }

            // TODO should this be done here, it could be done for each COG builder
            if (this.generateVrt?.value) {
                const vrtTmp = await buildVrtForTiffs(job, vrtOptions, tmpFolder, logger);
                const readStream = createReadStream(vrtTmp);
                await outputFs.write(getJobPath(job, '.vrt'), readStream, logger);
            }

            const jobFile = getJobPath(job, `job.json`);
            await outputFs.write(jobFile, Buffer.from(JSON.stringify(job, null, 2)), logger);

            const geoJsonSourceOutput = getJobPath(job, `source.geojson`);
            await outputFs.write(geoJsonSourceOutput, Buffer.from(JSON.stringify(metadata.bounds, null, 2)), logger);

            const geoJsonCoveringOutput = getJobPath(job, `covering.geojson`);
            await outputFs.write(
                geoJsonCoveringOutput,
                Buffer.from(JSON.stringify(TileCover.toGeoJson(metadata.covering), null, 2)),
                logger,
            );

            logger.info({ job: jobFile }, 'Done');
        } finally {
            // Cleanup
            await fs.rmdir(tmpFolder, { recursive: true });
        }
    }

    protected onDefineParameters(): void {
        this.source = new CLiInputData(this, 'source');
        this.output = new CLiInputData(this, 'output');
        this.minZoom = this.defineIntegerParameter({
            argumentName: 'MIN_ZOOM',
            parameterLongName: '--min-zoom',
            description: 'min zoom level to use',
            defaultValue: this.MinZoomDefault,
            required: false,
        });

        this.maxCogs = this.defineIntegerParameter({
            argumentName: 'MAX_COGS',
            parameterLongName: '--max-cogs',
            description: 'Maximum number of COGs to create',
            defaultValue: this.MaxCogsDefault,
            required: false,
        });

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

        this.resample = this.defineStringParameter({
            argumentName: 'RESAMPLE',
            parameterLongName: '--resample',
            description: 'Resampling method to use',
            required: false,
        });
    }
}
