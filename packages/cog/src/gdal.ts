import { LogType, Projection, EPSG } from '@basemaps/shared';
import { ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import { GdalCogBuilderOptions } from './gdal.config';
import { GdalDocker } from './gdal.docker';

/** 1% Buffer to the tiff to help prevent gaps between tiles */
const TiffBuffer = 1.01;

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
    /** Parse the output looking for "." */
    gdal: GdalDocker;

    constructor(source: string, target: string, config: Partial<GdalCogBuilderOptions> = {}) {
        this.source = source;
        this.target = target;

        this.config = {
            bbox: config.bbox,
            alignmentLevels: config.alignmentLevels ?? 1,
            compression: config.compression ?? 'webp',
            resampling: config.resampling ?? 'lanczos',
            blockSize: config.blockSize ?? 512,
        };

        this.gdal = new GdalDocker(path.dirname(source));
    }

    getBounds(): string[] {
        if (this.config.bbox == null) {
            return [];
        }

        const [ulX, ulY, lrX, llY] = this.config.bbox;
        return [
            '-projwin',
            ulX,
            ulY,
            lrX * TiffBuffer,
            llY * TiffBuffer,
            '-projwin_srs',
            Projection.toEpsgString(EPSG.Google),
        ].map(String);
    }

    get args(): string[] {
        return [
            // GDAL Arguments
            `gdal_translate`,
            // Force output using COG Driver
            '-of',
            'COG',
            // Force GoogleMaps tiling
            '-co',
            'TILING_SCHEME=GoogleMapsCompatible',
            // Max CPU POWER
            '-co',
            'NUM_THREADS=ALL_CPUS',
            // Force big tiff the extra few bytes savings of using little tiffs does not affect us
            '-co',
            'BIGTIFF=YES',
            // Force a alpha layer
            '-co',
            'ADD_ALPHA=YES',
            // User configured output block size
            '-co',
            `BLOCKSIZE=${this.config.blockSize}`,
            // User configured resampling method
            '-co',
            `RESAMPLING=${this.config.resampling}`,
            // User configured compression
            '-co',
            `COMPRESS=${this.config.compression}`,
            // Number of levels to align to web mercator
            '-co',
            `ALIGNED_LEVELS=${this.config.alignmentLevels}`,
            ...this.getBounds(),

            this.source,
            this.target,
        ];
    }

    convert(log: LogType): Promise<void> {
        return this.gdal.run(this.args, log);
    }
}
