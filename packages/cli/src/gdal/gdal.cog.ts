import { LogType } from '@basemaps/shared';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { GdalCommand } from './gdal.command.js';
import { GdalCogBuilderDefaults, GdalCogBuilderOptions } from './gdal.config.js';
import { Gdal } from './gdal.js';

/** 1% Buffer to the tiff to help prevent gaps between tiles */
// const TiffBuffer = 1.01;

/**
 * A docker based GDAL Cog Builder
 *
 * This uses the new 3.1 COG Driver https://gdal.org/drivers/raster/cog.html
 *
 * When GDAL 3.1 is released docker could be removed from this process.
 */
export class GdalCogBuilder {
  config: GdalCogBuilderOptions;

  /**
   * Source file generally a .vrt
   */
  source: string;
  /**
   * Output file
   */
  target: string;

  /**
   * Current running child process
   */
  child: ChildProcessWithoutNullStreams | null;
  /**
   * Promise waiting for child process to finish
   */
  promise: Promise<void> | null;
  /** When the process started */
  startTime: number;
  /** Gdal process */
  gdal: GdalCommand;

  constructor(source: string, target: string, config: Partial<GdalCogBuilderOptions> = {}) {
    this.source = source;
    this.target = target;

    this.config = {
      bbox: config.bbox,
      alignmentLevels: config.alignmentLevels ?? GdalCogBuilderDefaults.alignmentLevels,
      compression: config.compression ?? GdalCogBuilderDefaults.compression,
      tileMatrix: config.tileMatrix ?? GdalCogBuilderDefaults.tileMatrix,
      resampling: config.resampling ?? GdalCogBuilderDefaults.resampling,
      blockSize: config.blockSize ?? GdalCogBuilderDefaults.blockSize,
      targetRes: config.targetRes ?? GdalCogBuilderDefaults.targetRes,
      quality: config.quality ?? GdalCogBuilderDefaults.quality,
    };
    this.gdal = Gdal.create();
    this.gdal.mount?.(source);
    this.gdal.mount?.(target);
  }

  getBounds(): string[] {
    if (this.config.bbox == null) {
      return [];
    }
    // TODO in theory this should be clamped to the lower right of the imagery, as there is no point generating large empty tiffs
    const [ulX, ulY, lrX, lrY] = this.config.bbox;
    const srs = this.config.tileMatrix.projection.toEpsgString();
    return [
      // Coordinates of subwindow in source image, expressed in SRS of target image
      '-projwin',
      ulX,
      ulY,
      lrX,
      lrY,
      // SRS of the coordinates of the `-projwin` subwindow above
      '-projwin_srs',
      srs,
      // Coordinates of extent of target image. Note the order of y coordinates
      // here is reversed compared to projwin above
      // `-co EXTENT=minx,miny,maxx,maxy` vs `-projwin <ulx> <uly> <lrx> <lry>`
      '-co',
      `EXTENT=${ulX},${lrY},${lrX},${ulY}`,
      // SRS of target image
      '-co',
      `TARGET_SRS=${srs}`,
    ].map(String);
  }

  get args(): string[] {
    const tr = this.config.targetRes.toString();
    return [
      // Force output using COG Driver
      '-of',
      'COG',
      // Max CPU POWER
      '-co',
      'NUM_THREADS=ALL_CPUS',
      // in GDAL 3.7.x NUM_THREADS will also set GDAL_NUM_THREADS
      '--config',
      'GDAL_NUM_THREADS',
      'ALL_CPUS',
      // Force big tiff the extra few bytes savings of using little tiffs does not affect us
      '-co',
      'BIGTIFF=YES',
      // Force a alpha layer
      '-co',
      'ADD_ALPHA=YES',
      // User configured output block size
      '-co',
      `BLOCKSIZE=${this.config.blockSize}`,
      // Configured resampling methods
      '-co',
      `WARP_RESAMPLING=${this.config.resampling.warp}`,
      '-co',
      `OVERVIEW_RESAMPLING=${this.config.resampling.overview}`,
      // User configured compression
      '-co',
      `COMPRESS=${this.config.compression}`,
      // Default quality of 75 is too low for our needs
      '-co',
      `QUALITY=${this.config.quality}`,
      // most of the imagery contains a lot of empty tiles, no need to output them
      '-co',
      `SPARSE_OK=YES`,
      // Do not attempt to read sidecar files
      '--config',
      `GDAL_DISABLE_READDIR_ON_OPEN`,
      `EMPTY_DIR`,
      // Force a target resolution to be better than the imagery not worse
      '-tr',
      tr,
      tr,
      ...this.getBounds(),
      this.source,
      this.target,
    ];
  }

  async convert(log: LogType): Promise<void> {
    await this.gdal.run('gdal_translate', this.args, log);
  }
}
