import { EPSG, Projection } from '@basemaps/geo';
import { Env, LogType } from '@basemaps/lambda-shared';
import { ChildProcessWithoutNullStreams } from 'child_process';
import { GdalCommand } from './gdal.command';
import { GdalCogBuilderOptions, GdalCogBuilderDefaults } from './gdal.config';
import { GdalDocker } from './gdal.docker';
import { GdalLocal } from './gdal.local';

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

    static getGdal(): GdalCommand {
        if (Env.get(Env.Gdal.UseDocker, undefined)) {
            return new GdalDocker();
        }
        return new GdalLocal();
    }

    static async getVersion(logger: LogType): Promise<string> {
        const gdal = GdalCogBuilder.getGdal();
        gdal.verbose = false;
        const { stdout } = await gdal.run('gdal_translate', ['--version'], logger);
        return stdout;
    }

    constructor(source: string, target: string, config: Partial<GdalCogBuilderOptions> = {}) {
        this.source = source;
        this.target = target;

        this.config = {
            bbox: config.bbox,
            alignmentLevels: config.alignmentLevels ?? GdalCogBuilderDefaults.alignmentLevels,
            compression: config.compression ?? GdalCogBuilderDefaults.compression,
            resampling: config.resampling ?? GdalCogBuilderDefaults.resampling,
            blockSize: config.blockSize ?? GdalCogBuilderDefaults.blockSize,
            quality: config.quality ?? GdalCogBuilderDefaults.quality,
        };
        this.gdal = GdalCogBuilder.getGdal();

        this.gdal.mount?.(source);
        this.gdal.mount?.(target);
    }

    getBounds(): string[] {
        if (this.config.bbox == null) {
            return [];
        }

        // TODO in theory this should be clamped to the lower right of the imagery, as there is no point generating large empty tiffs
        const [ulX, ulY, lrX, lrY] = this.config.bbox;
        return ['-projwin', ulX, ulY, lrX, lrY, '-projwin_srs', Projection.toEpsgString(EPSG.Google)].map(String);
    }

    get args(): string[] {
        return [
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
            // Default quality of 75 is too low for our needs
            '-co',
            `QUALITY=${this.config.quality}`,
            // most of the imagery contains a lot of empty tiles, no need to output them
            '-co',
            `SPARSE_OK=YES`,
            ...this.getBounds(),

            this.source,
            this.target,
        ];
    }

    async convert(log: LogType): Promise<void> {
        await this.gdal.run('gdal_translate', this.args, log);
    }
}
