import { Rgba } from '@basemaps/config';
import { Epsg, EpsgCode, TileMatrixSets } from '@basemaps/geo';
import { urlToString } from '@basemaps/shared';

import { Presets } from '../preset.js';
import { GdalCommand } from './gdal.runner.js';
import { CogifyCreationOptions } from './stac.js';

const isPowerOfTwo = (x: number): boolean => (x & (x - 1)) === 0;

interface TargetOptions {
  targetSrs?: string;
  extent?: number[];
  targetResolution?: number;
}

function getTargetOptions(opt: CogifyCreationOptions): TargetOptions {
  const targetOpts: TargetOptions = {};

  if (opt.tileMatrix) {
    const tileMatrix = TileMatrixSets.find(opt.tileMatrix);
    if (tileMatrix == null) throw new Error('Unable to find tileMatrix: ' + opt.tileMatrix);
    if (opt.noReprojecting == null) targetOpts.targetSrs = tileMatrix.projection.toEpsgString();

    if (opt.tile) {
      const bounds = tileMatrix.tileToSourceBounds(opt.tile);
      targetOpts.extent = [
        Math.min(bounds.x, bounds.right),
        Math.min(bounds.y, bounds.bottom),
        Math.max(bounds.x, bounds.right),
        Math.max(bounds.y, bounds.bottom),
      ];
    }

    if (opt.zoomLevel) {
      targetOpts.targetResolution = tileMatrix.pixelScale(opt.zoomLevel);
    }
  }
  return targetOpts;
}

export function gdalBuildVrt(targetVrt: URL, source: URL[], opt?: CogifyCreationOptions): GdalCommand {
  if (source.length === 0) throw new Error('No source files given for :' + targetVrt.href);
  return {
    output: targetVrt,
    command: 'gdalbuildvrt',
    args: [opt && opt.addalpha ? ['-addalpha'] : undefined, urlToString(targetVrt), ...source.map(urlToString)]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };
}

export function gdalBuildVrtWarp(
  targetVrt: URL,
  sourceVrt: URL,
  sourceProjection: EpsgCode,
  cutline: { url: URL | null; blend: number },
  opt: CogifyCreationOptions,
): GdalCommand {
  const tileMatrix = TileMatrixSets.find(opt.tileMatrix);
  if (tileMatrix == null) throw new Error('Unable to find tileMatrix: ' + opt.tileMatrix);
  if (opt.zoomLevel == null) throw new Error('Unable to find zoomLevel');
  const targetResolution = tileMatrix.pixelScale(opt.zoomLevel);

  return {
    output: targetVrt,
    command: 'gdalwarp',
    args: [
      ['-of', 'vrt'], // Output as a VRT
      // ['-co', 'compress=lzw'],
      // ['-co', 'bigtiff=yes'],
      '-multi', // Mutithread IO
      ['-wo', 'NUM_THREADS=ALL_CPUS'], // Multithread the warp
      ['-s_srs', Epsg.get(sourceProjection).toEpsgString()], // Source EPSG
      ['-t_srs', tileMatrix.projection.toEpsgString()], // Target EPSG
      ['-tr', targetResolution, targetResolution],
      opt.warpResampling ? ['-r', opt.warpResampling] : undefined,
      cutline.url ? ['-cutline', urlToString(cutline.url), '-cblend', cutline.blend] : undefined,
      urlToString(sourceVrt),
      urlToString(targetVrt),
    ]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };
}

export function gdalBuildCog(targetTiff: URL, sourceVrt: URL, opt: CogifyCreationOptions): GdalCommand {
  const cfg = { ...Presets[opt.preset], ...opt };

  const targetOpts = getTargetOptions(cfg);

  return {
    command: 'gdal_translate',
    output: targetTiff,
    args: [
      ['-of', 'COG'],
      ['-co', 'NUM_THREADS=ALL_CPUS'], // Use all CPUS
      ['--config', 'GDAL_NUM_THREADS', 'all_cpus'], // Also required to NUM_THREADS till gdal 3.7.x
      cfg.srcwin ? ['-srcwin', cfg.srcwin[0], cfg.srcwin[1], cfg.srcwin[2], cfg.srcwin[3]] : undefined,
      cfg.bigTIFF ? ['-co', `BIGTIFF=${cfg.bigTIFF}`] : ['-co', 'BIGTIFF=IF_NEEDED'], // BigTiff is somewhat slower and most (All?) of the COGS should be well below 4GB
      ['-co', 'ADD_ALPHA=YES'],
      ['-co', `BLOCKSIZE=${cfg.blockSize}`],
      /**
       *  GDAL will recompress existing overviews if they exist which will compound
       *  any lossly compression on the overview, so compute new overviews instead
       */
      ['-co', 'OVERVIEWS=IGNORE_EXISTING'],
      cfg.overviewCompress ? ['-co', `OVERVIEW_COMPRESS=${cfg.overviewCompress}`] : undefined,
      cfg.overviewQuality ? ['-co', `OVERVIEW_QUALITY=${cfg.overviewQuality}`] : undefined,
      cfg.warpResampling ? ['-co', `WARP_RESAMPLING=${cfg.warpResampling}`] : undefined,
      cfg.overviewResampling ? ['-co', `OVERVIEW_RESAMPLING=${cfg.overviewResampling}`] : undefined,
      ['-co', `COMPRESS=${cfg.compression}`],
      cfg.quality ? ['-co', `QUALITY=${cfg.quality}`] : undefined,
      cfg.maxZError ? ['-co', `MAX_Z_ERROR=${cfg.maxZError}`] : undefined,
      cfg.maxZErrorOverview ? ['-co', `MAX_Z_ERROR_OVERVIEW=${cfg.maxZErrorOverview}`] : undefined,
      ['-co', 'SPARSE_OK=YES'],
      targetOpts.targetSrs ? ['-co', `TARGET_SRS=${targetOpts.targetSrs}`] : undefined,
      targetOpts.extent ? ['-co', `EXTENT=${targetOpts.extent.join(',')},`] : undefined,
      targetOpts.targetResolution ? ['-tr', targetOpts.targetResolution, targetOpts.targetResolution] : undefined,
      urlToString(sourceVrt),
      urlToString(targetTiff),
    ]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };
}

/**
 * Creates an empty tiff where all pixel values are set to the given color.
 * Used to force a background so that there are no empty pixels in the final COG.
 *
 * @param targetTiff the file path and name for the created tiff
 * @param color the color to set all pixel values
 * @param opt a CogifyCreationOptions object
 *
 * @returns a 'gdal_create' GdalCommand object
 */
export function gdalCreate(targetTiff: URL, color: Rgba, opt: CogifyCreationOptions): GdalCommand {
  const cfg = { ...Presets[opt.preset], ...opt };

  const tileMatrix = TileMatrixSets.find(cfg.tileMatrix);
  if (tileMatrix == null) throw new Error('Unable to find tileMatrix: ' + cfg.tileMatrix);

  const bounds = tileMatrix.tileToSourceBounds(cfg.tile ?? { x: 0, y: 0, z: 0 });
  const pixelScale = tileMatrix.pixelScale(cfg.zoomLevel ?? 0);
  const size = Math.round(bounds.width / pixelScale);

  // if the value of 'size' is not a power of 2
  if (!isPowerOfTwo(size)) throw new Error('Size did not compute to a power of 2');

  return {
    command: 'gdal_create',
    output: targetTiff,
    args: [
      ['-of', 'GTiff'],
      ['-outsize', size, size], // set the size to match that of the final COG
      ['-bands', '4'],
      ['-burn', `${color.r} ${color.g} ${color.b} ${color.alpha}`], // set all pixel values to the given color
      ['-a_srs', tileMatrix.projection.toEpsgString()],
      ['-a_ullr', bounds.x, bounds.bottom, bounds.right, bounds.y],
      ['-co', 'COMPRESS=LZW'],
      urlToString(targetTiff),
    ]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };
}
