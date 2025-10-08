import { Rgba } from '@basemaps/config';
import { Epsg, EpsgCode, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { urlToString } from '@basemaps/shared';

import { PresetName, Presets } from '../../preset.js';
import { CogifyCreationOptions } from '../stac.js';
import { GdalCommand } from './gdal.runner.js';

const isPowerOfTwo = (x: number): boolean => (x & (x - 1)) === 0;

/**
 * Topographic mapsheets are rendered generally at 1:600 dpi,
 *
 * A topo50 mapsheet 1:600dpi does not perfectly align to full pixels and approximatly 1.7 pixels
 * of empty space is rendered at the edge of every mapsheet.
 *
 */
const PixelTrimTop = 1;
const PixelTrimRight = 4;

export function gdalBuildVrt(targetVrt: URL, source: URL[], addalpha: boolean): GdalCommand {
  if (source.length === 0) throw new Error('No source files given for :' + targetVrt.href);
  return {
    output: targetVrt,
    command: 'gdalbuildvrt',
    args: [addalpha ? ['-addalpha'] : undefined, urlToString(targetVrt), ...source.map(urlToString)]
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
  const targetResolution = tileMatrix.pixelScale(opt.zoomLevel);

  return {
    output: targetVrt,
    command: 'gdalwarp',
    args: [
      ['-of', 'vrt'], // Output as a VRT
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

function getCompressionArgs(cfg: CogifyCreationOptions): string[][] {
  if (cfg.compression === 'lerc') {
    return [
      ['-co', `MAX_Z_ERROR=${cfg.maxZError}`],
      ['-co', `MAX_Z_ERROR_OVERVIEW=${cfg.maxZErrorOverview}`],
    ];
  }
  if (cfg.compression === 'zstd') {
    return [cfg.predictor ? ['-co', `PREDICTOR=${cfg.predictor}`] : [], ['-co', `LEVEL=${cfg.level}`]];
  }

  if (cfg.compression === 'webp' || cfg.compression === 'jpeg') {
    return [['-co', `QUALITY=${cfg.quality}`]];
  }

  if (cfg.compression === 'lzw') {
    return [cfg.predictor ? ['-co', `PREDICTOR=${cfg.predictor}`] : []];
  }

  throw new Error('Unknown compression preset:' + String(cfg['compression']));
}

export function gdalBuildCog(targetTiff: URL, sourceVrt: URL, opt: CogifyCreationOptions): GdalCommand {
  const cfg = { ...Presets[opt.preset as PresetName], ...opt };
  const tileMatrix = TileMatrixSets.find(cfg.tileMatrix);
  if (tileMatrix == null) throw new Error('Unable to find tileMatrix: ' + cfg.tileMatrix);

  const bounds = tileMatrix.tileToSourceBounds(cfg.tile);
  const tileExtent = [
    Math.min(bounds.x, bounds.right),
    Math.min(bounds.y, bounds.bottom),
    Math.max(bounds.x, bounds.right),
    Math.max(bounds.y, bounds.bottom),
  ];

  const targetResolution = tileMatrix.pixelScale(cfg.zoomLevel);

  return {
    command: 'gdal_translate',
    output: targetTiff,
    args: [
      ['-of', 'COG'],
      ['-co', 'NUM_THREADS=ALL_CPUS'], // Use all CPUS
      ['-co', 'BIGTIFF=IF_NEEDED'], // BigTiff is somewhat slower and most (All?) of the COGS should be well below 4GB
      ['-co', 'ADD_ALPHA=YES'],
      /**
       *  GDAL will recompress existing overviews if they exist which will compound
       *  any lossly compression on the overview, so compute new overviews instead
       */
      ['-co', 'OVERVIEWS=IGNORE_EXISTING'],
      ['-co', `BLOCKSIZE=${cfg.blockSize}`],
      ['-co', `WARP_RESAMPLING=${cfg.warpResampling}`],
      ['-co', `OVERVIEW_RESAMPLING=${cfg.overviewResampling}`],
      ['-co', `COMPRESS=${cfg.compression}`],
      ...getCompressionArgs(cfg),

      cfg.presetBands ? ['-colorinterp', cfg.presetBands.join(',')] : undefined,

      ['-co', 'SPARSE_OK=YES'],
      ['-co', `TARGET_SRS=${tileMatrix.projection.toEpsgString()}`],
      ['-co', `EXTENT=${tileExtent.join(',')},`],
      ['-stats'],
      ['-tr', targetResolution, targetResolution],
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
  const cfg = { ...Presets[opt.preset as PresetName], ...opt };

  const tileMatrix = TileMatrixSets.find(cfg.tileMatrix);
  if (tileMatrix == null) throw new Error('Unable to find tileMatrix: ' + cfg.tileMatrix);

  const bounds = tileMatrix.tileToSourceBounds(cfg.tile);
  const pixelScale = tileMatrix.pixelScale(cfg.zoomLevel);
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

/**
 * Build a topographic mapsheet cog
 *
 * This is specific configuration to LINZ's topo50 and 250 mapsheets
 */
export function gdalBuildTopoRasterCommands(
  targetTiff: URL,
  sourceVrt: URL,
  opt: CogifyCreationOptions,
  width: number,
  height: number,
): GdalCommand {
  const command: GdalCommand = {
    command: 'gdal_translate',
    output: targetTiff,
    args: [
      ['-q'], // Supress non-error output
      ['-stats'], // Force stats (re)computation
      ['-of', 'COG'], // Output format
      ['-srcwin', 0, PixelTrimTop, width - PixelTrimRight, height - PixelTrimTop],
      ['-a_srs', `EPSG:${opt.sourceEpsg}`],

      // https://gdal.org/en/latest/drivers/raster/cog.html#creation-options
      ['-co', 'BIGTIFF=NO'],
      ['-co', 'BLOCKSIZE=512'],
      ['-co', 'COMPRESS=WEBP'],
      ['-co', 'NUM_THREADS=ALL_CPUS'], // Use all CPUS
      ['-co', 'OVERVIEW_COMPRESS=WEBP'],
      ['-co', 'OVERVIEWS=IGNORE_EXISTING'],
      ['-co', 'OVERVIEW_QUALITY=90'],
      ['-co', 'OVERVIEW_RESAMPLING=LANCZOS'],
      ['-co', 'QUALITY=100'],
      ['-co', 'SPARSE_OK=TRUE'], // Allow for sparse writes

      // https://gdal.org/en/latest/drivers/raster/cog.html#reprojection-related-creation-options
      ['-co', 'ADD_ALPHA=YES'],
      urlToString(sourceVrt),
      urlToString(targetTiff),
    ]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };

  return command;
}

/**
 * Standardized gdalwarp command for charts mapsheets
 *
 * Reproject the charts tif with the cutline applied.
 */
export function gdalBuildChartsCommand(target: URL, source: URL, cutline: URL, tileMatrix: TileMatrixSet): GdalCommand {
  return {
    output: target,
    command: 'gdalwarp',
    args: [
      ['-of', 'COG'],
      '-multi',
      ['-wo', 'NUM_THREADS=ALL_CPUS'],
      ['-t_srs', tileMatrix.projection.toEpsgString()],
      ['-b', '1', '-b', '2', '-b', '3'], // Drop dummy band 4 if it exists
      ['-dstalpha'],
      ['-cutline', urlToString(cutline)],
      ['-crop_to_cutline'],
      ['-co', 'BIGTIFF=NO'],
      ['-r', 'bilinear'],
      urlToString(source),
      urlToString(target),
    ]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };
}
