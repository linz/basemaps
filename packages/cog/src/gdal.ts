import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { GdalCogBuilderOptions } from './gdal.config';
import { GdalProgressParser } from './gdal.progress';
import { LogType } from '@basemaps/shared';

const DOCKER_CONTAINER = 'osgeo/gdal';
const DOCKER_CONTAINER_TAG = 'ubuntu-small-latest';

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
    parser: GdalProgressParser;

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
        this.parser = new GdalProgressParser();
    }

    getBounds(): string[] {
        if (this.config.bbox == null) {
            return [];
        }
        const bbox = this.config.bbox.map(s => String(s));
        return ['-projwin', bbox[0], bbox[1], bbox[2], bbox[3], '-projwin_srs', 'EPSG:900913'];
    }

    getMount(source: string): string[] {
        if (source == null) {
            return [];
        }
        if (this.source.startsWith('/')) {
            const sourcePath = path.dirname(source);
            return ['-v', `${sourcePath}:${sourcePath}`];
        }
        return [];
    }

    getDockerArgs(): string[] {
        const userInfo = os.userInfo();

        return [
            'run',
            // Config the container to be run as the current user
            '--user',
            `${userInfo.uid}:${userInfo.gid}`,

            ...this.getMount(this.source),
            ...this.getMount(this.target),

            // Docker container
            '-i',
            `${DOCKER_CONTAINER}:${DOCKER_CONTAINER_TAG}`,
        ];
    }

    get args(): string[] {
        return [
            ...this.getDockerArgs(),
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

    convert(log?: LogType): Promise<void> {
        if (this.promise != null) {
            return this.promise;
        }
        this.startTime = Date.now();

        const child = spawn('docker', this.args);
        this.child = child;

        const errorBuff: Buffer[] = [];
        child.stderr.on('data', (data: Buffer) => errorBuff.push(data));
        child.stdout.on('data', (data: Buffer) => this.parser.data(data));

        this.promise = new Promise((resolve, reject) => {
            child.on('exit', (code: number) => {
                if (code != 0) {
                    log?.error({ code, log: errorBuff.join('').trim() }, 'FailedToConvert');
                    return reject(new Error('Failed to execute GDAL: ' + errorBuff.join('').trim()));
                }
                return resolve();
            });
            child.on('error', (error: Error) => {
                log?.error({ error, log: errorBuff.join('').trim() }, 'FailedToConvert');
                reject(error);
            });
        });

        return this.promise;
    }
}
