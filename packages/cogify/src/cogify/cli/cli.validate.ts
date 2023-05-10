import { GoogleTms, Nztm2000QuadTms, Projection, TileId, TileMatrixSet } from '@basemaps/geo';
import { LogType, fsa } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { CompositionTiff, Tiler } from '@basemaps/tiler';
import { CogTiff } from '@cogeotiff/core';
import { command, option, restPositionals, string } from 'cmd-ts';
import { getLogger, logArguments } from '../../log.js';

const SupportedTileMatrix = [GoogleTms, Nztm2000QuadTms];

function isTiff(f: string): boolean {
  return f.toLowerCase().endsWith('.tiff') || f.toLowerCase().endsWith('.tif');
}

export const BasemapsCogifyValidateCommand = command({
  name: 'cogify-validate',
  version: CliInfo.version,
  args: {
    ...logArguments,
    paths: restPositionals({ type: string, displayName: 'path', description: 'Path to source imagery' }),
    tileMatrix: option({
      type: string,
      long: 'tile-matrix',
      description: `Output TileMatrix to use [${SupportedTileMatrix.map((f) => f.identifier).join(', ')}]`,
    }),
  },
  async handler(args) {
    const logger = getLogger(this, args);

    const tileMatrix = SupportedTileMatrix.find((f) => f.identifier.toLowerCase() === args.tileMatrix.toLowerCase());
    if (tileMatrix == null) throw new Error('Cannot find tileMatrix:' + args.tileMatrix);

    let failed = 0;
    let count = 0;

    await Promise.all(
      args.paths.map(async (path) => {
        if (!isTiff(path)) {
          logger.warn({ path }, 'Cog:Validate:Skip:NotTiff');
          return;
        }
        count++;
        if ((await validateCog(path, tileMatrix, logger)) === false) failed++;
      }),
    );

    logger.info({ count, failed }, 'Cog:Validated');
  },
});

export interface ValidationContext {
  path: string;
  tiff: CogTiff;
  tileMatrix: TileMatrixSet;
  logger: LogType;
}

export const ValidationSteps = [
  imageryIsSquare,
  imageryIsPowerOfTwo,
  imageryOverviewResolution,
  imageryMatchesResolutions,
  tilesAlign,
];

async function validateCog(path: string, tileMatrix: TileMatrixSet, logger: LogType): Promise<boolean> {
  const log = logger.child({ path });
  log.debug('Tiff:Load');
  const tiff = await new CogTiff(fsa.source(path)).init(true);

  const ctx: ValidationContext = { path, tiff, tileMatrix, logger: log };

  for (const step of ValidationSteps) {
    const isOk = await step(ctx);
    if (isOk) ctx.logger.info('✔️ Imagery:' + step.name);
  }

  await tiff.close();
  return false;
}

/** Imagery overviews should always scale out at a power of two */
export async function imageryOverviewResolution(ctx: ValidationContext): Promise<boolean> {
  let isOk = true;
  let lastImageSize = -1;
  for (const im of ctx.tiff.images) {
    const size = im.size;
    // Should scale out 2x at a time
    if (lastImageSize > 0) {
      const sizeRatio = lastImageSize / size.width;
      if (sizeRatio === 2) {
        ctx.logger.trace({ image: im.id, ratio: sizeRatio }, '✔️ Imagery:OverviewResolution');
      } else {
        ctx.logger.warn({ image: im.id, ratio: sizeRatio }, '❌ Imagery:OverviewResolution:Failed');
        isOk = false;
      }
    }
    lastImageSize = size.width;
  }

  return isOk;
}

/** A perfectly aligned COG should be a square as tile matrixes are generally starting from 256x256 tiles */
export async function imageryIsSquare(ctx: ValidationContext): Promise<boolean> {
  let isOk = true;
  for (const im of ctx.tiff.images) {
    const size = im.size;

    if (size.width === size.height) {
      ctx.logger.trace({ image: im.id, size: `${size.width}x${size.height}` }, '✔️ Imagery:isSquare');
    } else {
      ctx.logger.warn({ image: im.id, size: `${size.width}x${size.height}` }, '❌ Imagery:isSquare:Failed');
      isOk = false;
    }
  }

  return isOk;
}

function isPowerOfTwo(x: number): boolean {
  return (x & (x - 1)) === 0;
}

/**
 * Tile Matrix width/height should all be a multiple of 256 (which is a multiple of 2)
 *
 * ```
 * 256x256
 * 512x512
 * 1024x1024
 * ...
 * ```
 */
export async function imageryIsPowerOfTwo(ctx: ValidationContext): Promise<boolean> {
  let isOk = true;
  for (const im of ctx.tiff.images) {
    const size = im.size;

    const widthScale = size.width / 256;

    if (isPowerOfTwo(widthScale)) {
      ctx.logger.trace({ image: im.id, scale: widthScale }, '✔️ Imagery:isPowerOf2');
    } else {
      ctx.logger.warn({ image: im.id, scale: widthScale }, '❌ Imagery:isPowerOf2:Failed');
      isOk = false;
    }
  }

  return isOk;
}

/**
 * All images in the COG should have a resolution that closely matches a resoltution in the target tile matrix
 *
 * A small error is allowed (+- 1x10^-8 meters) for floating point math
 */
export async function imageryMatchesResolutions(ctx: ValidationContext): Promise<boolean> {
  let isOk = true;
  for (const im of ctx.tiff.images) {
    const resolution = im.resolution[0];
    const targetBaseZoom = Projection.getTiffResZoom(ctx.tileMatrix, resolution);
    const targetResolution = ctx.tileMatrix.pixelScale(targetBaseZoom);

    const resDiff = Math.abs(resolution - targetResolution);

    if (resDiff < 1e-8) {
      ctx.logger.trace({ image: im.id, difference: resDiff }, '✔️ Imagery:isImageryMatchResolution');
    } else {
      ctx.logger.warn({ image: im.id, difference: resDiff }, '❌ Imagery:isImageryMatchResolution:Failed');
      isOk = false;
    }
  }

  return isOk;
}

/**
 * To validate that the tile serving logic will not need to request multiple tiles to serve a single tile
 *
 * Check all four corner tiles of every resolution and ensure only one tile is requested from the tiff to create the output tile.
 */
export async function tilesAlign(ctx: ValidationContext): Promise<boolean> {
  const tiler = new Tiler(ctx.tileMatrix);
  let isOk = true;

  // Not all tiles will have data in the tiff so these two numbers will vary
  // `tileCount` should be somewhere close to `expectedCount`
  let tileCount = 0; // Number of tiles validated
  let expectedCount = 0; // Total number checked
  for (const im of ctx.tiff.images) {
    const resolution = im.resolution;
    const origin = im.origin;
    const size = im.size;

    const targetBaseZoom = Projection.getTiffResZoom(ctx.tileMatrix, resolution[0]);

    const topLeft = ctx.tileMatrix.sourceToPixels(origin[0], origin[1], targetBaseZoom);
    const topLeftTile = ctx.tileMatrix.pixelsToTile(topLeft.x, topLeft.y, targetBaseZoom);
    const bottomRightTile = ctx.tileMatrix.pixelsToTile(
      topLeft.x + size.width - ctx.tileMatrix.tileSize,
      topLeft.y + size.height - ctx.tileMatrix.tileSize,
      targetBaseZoom,
    );

    // De duplicate the tile corners
    const tileCorners = new Set([
      TileId.fromTile({ z: targetBaseZoom, x: topLeftTile.x, y: topLeftTile.y }), // Top Left
      TileId.fromTile({ z: targetBaseZoom, x: bottomRightTile.x, y: topLeftTile.y }), // Top Right
      TileId.fromTile({ z: targetBaseZoom, x: bottomRightTile.x, y: bottomRightTile.y }), // Bottom Right
      TileId.fromTile({ z: targetBaseZoom, x: topLeftTile.x, y: bottomRightTile.y }), // Bottom Left
    ]);

    for (const tileId of tileCorners) {
      expectedCount++;
      const tile = TileId.toTile(tileId);
      const composition = await tiler.tile([ctx.tiff], tile.x, tile.y, tile.z);
      // Tile is possibly null?
      if (composition == null || composition.length === 0) continue;
      // TIFF needs multiple tiles to render this tile
      if (composition.length !== 1) {
        ctx.logger.warn({ tileId }, 'Tile:Failed:MultipleTilesRequested');
        isOk = false;
        break;
      }
      const source = composition[0] as CompositionTiff;

      // This tile should have been rendered from this image
      if (source.source.imageId !== im.id) {
        ctx.logger.warn({ tileId, sourceId: source.source.imageId, imageId: im.id }, 'Tile:Failed:ImageIdMisMatch');
        isOk = false;
        break;
      }

      // Images should need to be scaled
      if (source.resize) {
        ctx.logger.warn({ tileId, imageId: im.id }, 'Tile:Failed:ScaleRequired');
        isOk = false;
        break;
      }
      tileCount++;
    }
  }
  // If no tiles were created possibly the imagery is just in the middle of the tiff and the edges contain no tiles
  // TODO some of the overviews should create tiles so tileCount should never be 0
  if (tileCount === 0) {
    ctx.logger.warn({ tileCount, tilesTested: expectedCount }, 'Tile:Skipped');
  } else {
    ctx.logger.debug({ tileCount, tilesTested: expectedCount }, 'Tile:Counts');
  }
  return isOk;
}
