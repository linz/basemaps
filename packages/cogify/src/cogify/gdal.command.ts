import { Epsg, EpsgCode, TileMatrixSets } from '@basemaps/geo';
import { GdalCommand } from './gdal.runner.js';
import { CogifyCreationOptions } from './stac.js';
import { Presets } from '../preset.js';

export function gdalBuildVrt(id: string, source: string[]): GdalCommand {
  if (source.length === 0) throw new Error('No source files given for :' + id);
  return { output: id + '.vrt', command: 'gdalbuildvrt', args: [id + '.vrt', ...source] };
}

export function gdalBuildVrtWarp(
  id: string,
  sourceVrt: string,
  sourceProjection: EpsgCode,
  cutline: { path: string | null; blend: number },
  opt: CogifyCreationOptions,
): GdalCommand {
  const tileMatrix = TileMatrixSets.find(opt.tileMatrix);
  if (tileMatrix == null) throw new Error('Unable to find tileMatrix: ' + opt.tileMatrix);
  return {
    output: id + '.' + tileMatrix.identifier + '.vrt',
    command: 'gdalwarp',
    args: [
      ['-of', 'VRT'], // Output as a VRT
      '-multi', // Mutithread IO
      ['-wo', 'NUM_THREADS=ALL_CPUS'], // Multithread the warp
      ['-s_srs', Epsg.get(sourceProjection).toEpsgString()], // Source EPSG
      ['-t_srs', tileMatrix.projection.toEpsgString()], // Target EPSG
      opt.warpResampling ? ['-r', opt.warpResampling] : undefined,
      cutline.path ? ['-cutline', cutline.path, '-cblend', cutline.blend] : undefined,
      sourceVrt,
      id + '.' + tileMatrix.identifier + '.vrt',
    ]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };
}

export function gdalBuildCog(id: string, sourceVrt: string, opt: CogifyCreationOptions): GdalCommand {
  const cfg = { ...Presets[opt.preset], ...opt };
  const tileMatrix = TileMatrixSets.find(cfg.tileMatrix);
  if (tileMatrix == null) throw new Error('Unable to find tileMatrix: ' + cfg.tileMatrix);

  const targetTiff = id + '.tiff';

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
      ['--config', 'GDAL_NUM_THREADS', 'all_cpus'], // Also required to NUM_THREADS till gdal 3.7.x
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
      cfg.quality ? ['-co', `QUALITY=${cfg.quality}`] : undefined,
      cfg.maxZError ? ['-co', `MAX_Z_ERROR=${cfg.maxZError}`] : undefined,
      cfg.maxZErrorOverview ? ['-co', `MAX_Z_ERROR_OVERVIEW=${cfg.maxZErrorOverview}`] : undefined,
      ['-co', 'SPARSE_OK=YES'],
      ['-co', `TARGET_SRS=${tileMatrix.projection.toEpsgString()}`],
      ['-co', `EXTENT=${tileExtent.join(',')},`],
      ['-tr', targetResolution, targetResolution],
      sourceVrt,
      targetTiff,
    ]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };
}
