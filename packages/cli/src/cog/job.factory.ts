import { Bounds } from '@basemaps/geo';
import { fsa, isConfigS3Role, isFileConfigPath, LogConfig } from '@basemaps/shared';
import * as ulid from 'ulid';
import { CogBuilder } from '../index.js';
import { BatchJob } from '../cli/cogify/batch.job.js';
import { Gdal } from '../gdal/gdal.js';
import { CogStacJob, JobCreationContext } from './cog.stac.job.js';
import { Cutline } from './cutline.js';
import { CogJob } from './types.js';
import { basename } from 'path';

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
    let imageryName = ctx.imageryName;
    if (imageryName == null) imageryName = basename(ctx.sourceLocation.path);

    const logger = LogConfig.get().child({ id, imageryName });

    const gdalVersion = await Gdal.version(logger);
    logger.info({ version: gdalVersion }, 'GdalVersion');

    const { sourceLocation } = ctx;
    logger.info(
      { source: ctx.sourceLocation.path, sourceRole: isConfigS3Role(sourceLocation) && sourceLocation.roleArn },
      'ListTiffs',
    );

    fsa.configure(sourceLocation);

    const tiffList = isFileConfigPath(sourceLocation)
      ? sourceLocation.files
      : (await fsa.toArray(fsa.list(sourceLocation.path))).filter(filterTiff);

    const tiffSource = tiffList.map((path: string) => fsa.source(path));

    const maxConcurrency = ctx.override?.concurrency ?? MaxConcurrencyDefault;

    logger.info({ source: sourceLocation.path, tiffCount: tiffList.length }, 'LoadingTiffs');

    const cutline = new Cutline(
      ctx.tileMatrix,
      ctx.cutline && (await Cutline.loadCutline(ctx.cutline.href)),
      ctx.cutline?.blend,
      ctx.oneCogCovering,
    );

    const builder = new CogBuilder(ctx.tileMatrix, maxConcurrency, logger, ctx.override?.projection);
    const metadata = await builder.build(tiffSource, cutline);

    if (cutline.clipPoly.length === 0) {
      // no cutline needed for this imagery set
      ctx.cutline = undefined;
    }

    const files = metadata.files.sort(Bounds.compareArea);
    if (files.length > 0) {
      const bigArea = files[files.length - 1];
      const smallArea = files[0];
      logger.info(
        {
          tileMatrix: ctx.tileMatrix.identifier,
          // Size of the biggest image
          big: bigArea.width / cutline.tileMatrix.pixelScale(metadata.resZoom),
          // Size of the smallest image
          small: smallArea.width / cutline.tileMatrix.pixelScale(metadata.resZoom),
        },
        'Covers',
      );
    }

    // Don't log bounds as it is huge
    logger.info(
      {
        ...metadata,
        tileMatrix: ctx.tileMatrix.identifier,
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

    if (ctx.batch) await BatchJob.batchJob(job, true, undefined, logger);
    logger.info({ tileMatrix: ctx.tileMatrix.identifier, job: job.getJobPath() }, 'Done');

    return job;
  },
};
