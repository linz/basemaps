import { Bounds, Epsg } from '@basemaps/geo';
import {
    FileConfig,
    FileConfigPath,
    FileOperator,
    isConfigS3Role,
    isFileConfigPath,
    LogConfig,
    ProjectionTileMatrixSet,
} from '@basemaps/shared';
import { Projection } from '@basemaps/shared/build/proj/projection';
import { CogSource } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogSourceFile } from '@cogeotiff/source-file';
import { promises as fs } from 'fs';
import { basename } from 'path';
import * as ulid from 'ulid';
import { CogBuilder } from '..';
import { CliInfo } from '../cli/base.cli';
import { ActionBatchJob } from '../cli/cogify/action.batch';
import { getJobPath, makeTempFolder } from '../cli/folder';
import { Gdal } from '../gdal/gdal';
import { GdalCogBuilderDefaults, GdalCogBuilderResampling } from '../gdal/gdal.config';
import { Cutline } from './cutline';
import { CogJob } from './types';

export const MaxConcurrencyDefault = 50;

export interface JobCreationContext {
    /** Source config */
    source: FileConfig | FileConfigPath;

    /** Output config */
    output: FileConfig;

    /** Should the imagery be cut to a cutline */
    cutline?: {
        source: string;
        blend: number;
    };

    targetProjection: ProjectionTileMatrixSet;

    override?: {
        /** Override job id */
        id?: string;

        /**
         * Image quality
         * @default GdalCogBuilderDefaults.quality
         */
        quality?: number;

        /**
         * Number of threads to use for fetches
         * @default MaxConcurrencyDefault
         */
        concurrency?: number;

        /**
         * Override the source projection
         */
        projection?: Epsg;

        /**
         * Resampling method
         * @Default  GdalCogBuilderDefaults.resampling
         */
        resampling?: GdalCogBuilderResampling;
    };

    /**
     * Should this job be submitted to batch now?
     * @default false
     */
    batch: boolean;

    /** Should this job ignore source coverage and just produce one big COG for EPSG extent */
    oneCog: boolean;
}

function filterTiff(a: string): boolean {
    const lowerA = a.toLowerCase();
    return lowerA.endsWith('.tiff') || lowerA.endsWith('.tif');
}

export const CogJobFactory = {
    /**
     * Create a COG Job and potentially submit it to AWS Batch for processing
     */
    async create(ctx: JobCreationContext): Promise<CogJob> {
        const id = ctx.override?.id ?? ulid.ulid();
        const imageryName = basename(ctx.source.path).replace(/\./g, '-'); // batch does not allow '.' in names
        const logger = LogConfig.get().child({ id, imageryName });

        const gdalVersion = await Gdal.version(logger);
        logger.info({ version: gdalVersion }, 'GdalVersion');

        const { source, output } = ctx;
        logger.info({ source: ctx.source.path, sourceRole: isConfigS3Role(source) && source.roleArn }, 'ListTiffs');

        const sourceFs = FileOperator.create(source);
        const outputFs = FileOperator.create(output);
        const tiffList = isFileConfigPath(source)
            ? source.files
            : (await sourceFs.list(source.path)).filter(filterTiff);

        let tiffSource: CogSource[];
        if (FileOperator.isS3Processor(sourceFs)) {
            tiffSource = tiffList.map((path) => {
                const { bucket, key } = sourceFs.parse(path);
                // Use the same s3 credentials to access the files that were used to list them
                return new CogSourceAwsS3(bucket, key, sourceFs.s3);
            });
        } else {
            tiffSource = tiffList.map((path) => new CogSourceFile(path));
        }
        const maxConcurrency = ctx.override?.concurrency ?? MaxConcurrencyDefault;

        logger.info({ source: source.path, tiffCount: tiffList.length }, 'LoadingTiffs');

        const cutline = new Cutline(
            ctx.targetProjection,
            ctx.cutline && (await Cutline.loadCutline(ctx.cutline.source)),
            ctx.cutline?.blend,
            ctx.oneCog,
        );

        const builder = new CogBuilder(ctx.targetProjection, maxConcurrency, logger, ctx.override?.projection);
        const metadata = await builder.build(tiffSource, cutline);

        if (cutline.clipPoly.length == 0) {
            // no cutline needed for this imagery set
            ctx.cutline = undefined;
        }

        const sourceProjection = Projection.get(metadata.projection);

        const { tms } = cutline.targetPtms;

        const files = metadata.files.sort(Bounds.compareArea);
        if (files.length > 0) {
            const bigArea = files[files.length - 1];
            const smallArea = files[0];
            logger.info(
                {
                    // Size of the biggest image
                    big: bigArea.width / tms.pixelScale(metadata.resZoom),
                    // Size of the smallest image
                    small: smallArea.width / tms.pixelScale(metadata.resZoom),
                },
                'Covers',
            );
        }

        // Don't log bounds as it is huge
        logger.info(
            {
                ...metadata,
                bounds: undefined,
                fileCount: files.length,
                files: metadata.files
                    .map((r) => r.name)
                    .sort()
                    .join(' '),
            },
            'CoveringGenerated',
        );

        let addAlpha = true;
        // -addalpha to vrt adds extra alpha layers even if one already exist
        if (metadata.bands > 3) {
            logger.info({ bandCount: metadata.bands }, 'Vrt:DetectedAlpha, Disabling -addalpha');
            addAlpha = false;
        }

        const job: CogJob = {
            id,
            name: imageryName,
            projection: ctx.targetProjection.tms.projection.code,
            output: {
                ...output,
                resampling: ctx.override?.resampling ?? GdalCogBuilderDefaults.resampling,
                quality: ctx.override?.quality ?? GdalCogBuilderDefaults.quality,
                cutline: ctx.cutline,
                nodata: metadata.nodata,
                vrt: {
                    addAlpha,
                },
            },
            source: {
                ...source,
                pixelScale: metadata.pixelScale,
                resZoom: metadata.resZoom,
                projection: metadata.projection,
                files: metadata.bounds,
                options: { maxConcurrency },
            },
            bounds: metadata.targetBounds,
            files: metadata.files,
            generated: {
                ...CliInfo,
                date: new Date().toISOString(),
            },
        };

        const tmpFolder = await makeTempFolder(`basemaps-${job.id}`);
        try {
            const jobFile = getJobPath(job, `job.json`);
            await FileOperator.writeJson(jobFile, job, outputFs);

            if (ctx.cutline != null) {
                const geoJsonCutlineOutput = getJobPath(job, `cutline.geojson.gz`);
                await FileOperator.writeJson(geoJsonCutlineOutput, cutline.toGeoJson(), outputFs);
            }

            const geoJsonSourceOutput = getJobPath(job, `source.geojson`);
            await FileOperator.writeJson(geoJsonSourceOutput, sourceProjection.toGeoJson(metadata.bounds), outputFs);

            const geoJsonCoveringOutput = getJobPath(job, `covering.geojson`);
            await FileOperator.writeJson(
                geoJsonCoveringOutput,
                ctx.targetProjection.proj.toGeoJson(metadata.files),
                outputFs,
            );

            if (ctx.batch) {
                await ActionBatchJob.batchJob(jobFile, true, undefined, logger);
            }

            logger.info({ job: jobFile }, 'Done');
        } finally {
            // Cleanup
            await fs.rmdir(tmpFolder, { recursive: true });
        }

        return job;
    },
};
