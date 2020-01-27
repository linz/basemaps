import { Aws, LogType } from '@basemaps/shared';
import * as Mercator from 'global-mercator';
import { proj256 } from './builder';
import { VrtOptions } from './cog.vrt';
import { FileConfig, isConfigS3Role } from './file/file.config';
import { GdalCogBuilder } from './gdal';

export interface CogJob {
    /** Unique processing Id */
    id: string;

    /** Imagery set name */
    name: string;

    source: {
        /** List of input files */
        files: string[];
        /**
         * The google zoom level that corresponds approximately what the resolution of the source  is
         * for high quality aerial imagery this is generally 20-22
         */
        resolution: number;

        options: {
            maxCogs: number;
            maxConcurrency: number;
            minZoom: number;
        };
    } & FileConfig;

    /** Folder/S3 bucket to store the output */
    output: {
        vrt: {
            /** VRT path */
            path: string;
            options: VrtOptions;
        };
    } & FileConfig;

    /** List of quadkeys to generate */
    quadkeys: string[];
}

/**
 * Create a onProgress logger
 *
 * @param keys additional keys to log
 * @param logger base logger to use
 */
export function onProgress(keys: Record<string, any>, logger: LogType): (p: number) => void {
    let lastTime = Date.now();
    return (p: number): void => {
        logger.trace({ ...keys, progress: p.toFixed(2), progressTime: Date.now() - lastTime }, 'Progress');
        lastTime = Date.now();
    };
}

/**
 * Build a COG for a given collection of tiffs restricted to a WebMercator quadkey
 *
 * @param job the job to process
 * @param quadKey QuadKey to generate
 * @param vrtLocation Location of the source VRT file
 * @param outputTiffPath Path to where the output tiff will be stored
 * @param logger Logger to use
 * @param execute Whether to actually execute the transformation,
 */
export async function buildCogForQuadKey(
    job: CogJob,
    quadKey: string,
    vrtLocation: string,
    outputTiffPath: string,
    logger: LogType,
    execute = false,
): Promise<void> {
    const startTime = Date.now();
    const google = Mercator.quadkeyToGoogle(quadKey);
    const [minX, maxY, maxX, minY] = Mercator.googleToBBoxMeters(google);
    const alignmentLevels = job.source.resolution - google[2];

    // TODO this math is not right
    const pixelsPerMeter = proj256.getResolution(job.source.resolution);
    const imageSize = {
        width: Math.floor(Math.abs(minX - maxX) / pixelsPerMeter),
        height: Math.floor(Math.abs(minY - maxY) / pixelsPerMeter),
    };

    const cogBuild = new GdalCogBuilder(vrtLocation, outputTiffPath, {
        bbox: [minX, minY, maxX, maxY],
        alignmentLevels,
    });
    if (cogBuild.gdal.mount) {
        job.source.files.forEach(f => cogBuild.gdal.mount?.(f));
    }

    cogBuild.gdal.parser.on('progress', onProgress({ quadKey, target: 'tiff' }, logger));

    logger.info(
        {
            imageSize,
            quadKey,
            tile: { x: google[0], y: google[1], z: google[2] },
            alignmentLevels,
        },
        'CreateCog',
    );

    logger.debug({ cmd: cogBuild.args.join(' ') }, 'GdalTranslate');
    // If required assume role
    if (isConfigS3Role(job.source)) {
        const credentials = Aws.credentials.getCredentialsForRole(job.source.roleArn, job.source.externalId);
        cogBuild.gdal.setCredentials(credentials);
    }
    if (execute) {
        await cogBuild.convert(logger.child({ quadKey }));
        logger.info({ quadKey, duration: Date.now() - startTime }, 'CogCreated');
    }
}
