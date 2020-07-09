import { LogType } from '@basemaps/shared';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { Gdal } from './gdal';
import { GdalCommand } from './gdal.command';
import { GdalCogBuilderDefaults, GdalCogBuilderOptions } from './gdal.config';

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
            projection: config.projection ?? GdalCogBuilderDefaults.projection,
            alignmentLevels: config.alignmentLevels ?? GdalCogBuilderDefaults.alignmentLevels,
            compression: config.compression ?? GdalCogBuilderDefaults.compression,
            tilingScheme: config.tilingScheme ?? GdalCogBuilderDefaults.tilingScheme,
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
        return ['-projwin', ulX, ulY, lrX, lrY, '-projwin_srs', this.config.projection.toEpsgString()].map(String);
    }

    get args(): string[] {
        const tr = this.config.targetRes.toString();
        return [
            // Force output using COG Driver
            '-of',
            'COG',
            // Force GoogleMaps tiling
            '-co',
            `TILING_SCHEME=${this.config.tilingScheme}`,
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
            // Configured resampling methods
            '-co',
            `WARP_RESAMPLING=${this.config.resampling.warp}`,
            '-co',
            `OVERVIEW_RESAMPLING=${this.config.resampling.overview}`,
            // User configured compression
            '-co',
            `COMPRESS=${this.config.compression}`,
            // Number of levels to align to web mercator
            '-co',
            `ALIGNED_LEVELS=${this.config.alignmentLevels}`,
            // Default quality of 75 is too low for our needs
            '-co',
            `QUALITY=${this.config.quality}`,
            // most of the imagery contains a lot of empty tiles, no need to output them
            '-co',
            `SPARSE_OK=YES`,
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
