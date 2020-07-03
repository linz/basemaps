import { Bounds, Epsg } from '@basemaps/geo';
import {
    FileConfig,
    FileOperator,
    FileOperatorS3,
    isConfigS3Role,
    LogConfig,
    ProjectionTileMatrixSet,
} from '@basemaps/shared';
import { CogSource } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogSourceFile } from '@cogeotiff/source-file';
import { promises as fs } from 'fs';
import { basename } from 'path';
import * as ulid from 'ulid';
import { CogBuilder, GdalCogBuilder } from '..';
import { CliInfo } from '../cli/base.cli';
import { ActionBatchJob } from '../cli/cogify/action.batch';
import { getJobPath, makeTempFolder } from '../cli/folder';
import { GdalCogBuilderDefaults, GdalCogBuilderOptionsResampling } from '../gdal/gdal.config';
import { Cutline } from './cutline';
import { CogJob } from './types';
import { Projection } from '@basemaps/shared/build/proj/projection';

export const MaxConcurrencyDefault = 50;

export interface JobCreationContext {
    /** Source config */
    source: FileConfig;

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
        resampling?: {
            warp: GdalCogBuilderOptionsResampling;
            overview: GdalCogBuilderOptionsResampling;
        };
    };

    /**
     * Should this job be submitted to batch now?
     * @default false
     */
    batch?: boolean;
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

        const gdalVersion = await GdalCogBuilder.getVersion(logger);
        logger.info({ version: gdalVersion }, 'GdalVersion');

        const { source, output } = ctx;
        logger.info({ source: ctx.source.path, sourceRole: isConfigS3Role(source) && source.roleArn }, 'ListTiffs');

        const sourceFs = FileOperator.create(source);
        const outputFs = FileOperator.create(output);
        const tiffList = (await sourceFs.list(source.path)).filter(filterTiff);

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
        const maxConcurrency = ctx.override?.concurrency ?? MaxConcurrencyDefault;

        logger.info({ source: source.path, tiffCount: tiffList.length }, 'LoadingTiffs');

        const cutline = new Cutline(
            ctx.targetProjection,
            ctx.cutline && (await Cutline.loadCutline(ctx.cutline.source)),
            ctx.cutline?.blend,
        );

        const builder = new CogBuilder(ctx.targetProjection, maxConcurrency, logger, ctx.override?.projection);
        const metadata = await builder.build(tiffSource, cutline);

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
                resampling: GdalCogBuilderDefaults.resampling,
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
            // Local file systems need directories to be created before writing to them
            if (!FileOperatorS3.isS3(outputFs)) {
                await fs.mkdir(getJobPath(job), { recursive: true });
            }

            const jobFile = getJobPath(job, `job.json`);
            await outputFs.writeJson(jobFile, job, logger);

            if (cutline.clipPoly.length != 0) {
                const geoJsonCutlineOutput = getJobPath(job, `cutline.geojson.gz`);
                await outputFs.writeJson(geoJsonCutlineOutput, cutline.toGeoJson(), logger);
            }

            const geoJsonSourceOutput = getJobPath(job, `source.geojson`);
            await outputFs.writeJson(geoJsonSourceOutput, sourceProjection.toGeoJson(metadata.bounds), logger);

            const geoJsonCoveringOutput = getJobPath(job, `covering.geojson`);
            await outputFs.writeJson(
                geoJsonCoveringOutput,
                ctx.targetProjection.proj.toGeoJson(metadata.files),
                logger,
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
