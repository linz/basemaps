import { Bounds, TileMatrixSet } from '@basemaps/geo';
import { Env, LogType, Projection, isConfigS3Role } from '@basemaps/shared';
import { AwsCredentials } from '@chunkd/source-aws-v2';
import { GdalCogBuilder } from '../gdal/gdal.cog.js';
import { GdalCommand } from '../gdal/gdal.command.js';
import { GdalProgressParser } from '../gdal/gdal.progress.js';
import { CogJob } from './types.js';

/**
 * Create a onProgress logger
 *
 * @param keys additional keys to log
 * @param logger base logger to use
 */
export function onProgress(gdal: GdalCommand, keys: Record<string, any>, logger: LogType): void {
  let lastTime = Date.now();

  gdal.parser = new GdalProgressParser();
  gdal.parser.on('progress', (p: number): void => {
    logger.trace({ ...keys, progress: parseFloat(p.toFixed(2)), progressTime: Date.now() - lastTime }, 'Progress');
    lastTime = Date.now();
  });
}

/**
 * Build a COG for a given collection of tiffs
 *
 * @param job the job to process
 * @param name tile name of cog to generate
 * @param vrtLocation Location of the source VRT file
 * @param outputTiffPath Path to where the output tiff will be stored
 * @param logger Logger to use
 * @param execute Whether to actually execute the transformation,
 */
export async function buildCogForName(
  job: CogJob,
  name: string,
  vrtLocation: string,
  outputTiffPath: string,
  logger: LogType,
  execute = false,
): Promise<void> {
  const startTime = Date.now();

  const { targetZoom, tileMatrix } = job;

  const nb = job.output.files.find((nb) => nb.name === name);

  if (nb == null) {
    throw new Error("Can't find COG named " + name);
  }

  const bounds = Bounds.fromJson(nb);

  const tile = TileMatrixSet.nameToTile(name);

  const blockSize = tileMatrix.tileSize * 2; // FIXME is this blockFactor always 2

  const cogBuild = new GdalCogBuilder(vrtLocation, outputTiffPath, {
    bbox: [bounds.x, bounds.bottom, bounds.right, bounds.y],
    tileMatrix,
    blockSize,
    targetRes: job.output.gsd,
    resampling: job.output.resampling,
    quality: job.output.quality,
  });

  onProgress(cogBuild.gdal, { name, target: 'tiff' }, logger);

  logger.info(
    {
      imageSize: Projection.getImagePixelWidth(tileMatrix, tile, targetZoom),
      name,
      tile,
    },
    'CreateCog',
  );

  const sourceLocation = job.source.location;
  // If required assume role
  if (isConfigS3Role(sourceLocation)) {
    const credentials = AwsCredentials.role(
      sourceLocation.roleArn,
      sourceLocation.externalId,
      Env.getNumber(Env.AwsRoleDurationHours, 8) * 60 * 60,
    );
    cogBuild.gdal.setCredentials(credentials);
  }

  if (cogBuild.gdal.mount != null) {
    for (const file of job.source.files) cogBuild.gdal.mount(file.name);
  }

  if (execute) {
    await cogBuild.convert(logger.child({ name }));
    logger.info({ name, duration: Date.now() - startTime }, 'CogCreated');
  }
}
