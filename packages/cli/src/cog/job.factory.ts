import { Bounds } from '@basemaps/geo';
import { FileOperator, isConfigS3Role, isFileConfigPath, LogConfig } from '@basemaps/shared';
import { CogSource } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogSourceFile } from '@cogeotiff/source-file';
import { basename } from 'path';
import * as ulid from 'ulid';
import { CogBuilder } from '..';
import { ActionBatchJob } from '../cli/cogify/action.batch';
import { Gdal } from '../gdal/gdal';
import { JobCreationContext, CogStacJob } from './cog.stac.job';
import { Cutline } from './cutline';
import { CogJob } from './types';

export const MaxConcurrencyDefault = 50;

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
        const imageryName = basename(ctx.sourceLocation.path).replace(/\./g, '-'); // batch does not allow '.' in names
        const logger = LogConfig.get().child({ id, imageryName });

        const gdalVersion = await Gdal.version(logger);
        logger.info({ version: gdalVersion }, 'GdalVersion');

        const { sourceLocation } = ctx;
        logger.info(
            { source: ctx.sourceLocation.path, sourceRole: isConfigS3Role(sourceLocation) && sourceLocation.roleArn },
            'ListTiffs',
        );

        const sourceFs = FileOperator.create(sourceLocation);
        const tiffList = isFileConfigPath(sourceLocation)
            ? sourceLocation.files
            : (await FileOperator.toArray(sourceFs.list(sourceLocation.path))).filter(filterTiff);

        let tiffSource: CogSource[];
        if (FileOperator.isS3Processor(sourceFs)) {
            tiffSource = tiffList.map((path) => {
                const { bucket, key } = sourceFs.parse(path);
                if (key == null) throw new Error(`Failed to read tiff from uri: "${path}"`);
                // Use the same s3 credentials to access the files that were used to list them
                return new CogSourceAwsS3(bucket, key, sourceFs.s3);
            });
        } else {
            tiffSource = tiffList.map((path) => new CogSourceFile(path));
        }
        const maxConcurrency = ctx.override?.concurrency ?? MaxConcurrencyDefault;

        logger.info({ source: sourceLocation.path, tiffCount: tiffList.length }, 'LoadingTiffs');

        const cutline = new Cutline(
            ctx.targetProjection,
            ctx.cutline && (await Cutline.loadCutline(ctx.cutline.href)),
            ctx.cutline?.blend,
            ctx.oneCogCovering,
        );

        const builder = new CogBuilder(ctx.targetProjection, maxConcurrency, logger, ctx.override?.projection);
        const metadata = await builder.build(tiffSource, cutline);

        if (cutline.clipPoly.length == 0) {
            // no cutline needed for this imagery set
            ctx.cutline = undefined;
        }

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

        const job = await CogStacJob.create({
            id,
            imageryName,
            metadata,
            ctx,
            addAlpha,
            cutlinePoly: cutline.clipPoly,
        });

        if (ctx.batch) {
            await ActionBatchJob.batchJob(job, true, undefined, logger);
        }
        logger.info({ job: job.getJobPath() }, 'Done');

        return job;
    },
};
