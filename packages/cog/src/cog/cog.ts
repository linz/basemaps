import { QuadKey } from '@basemaps/geo';
import { Aws, isConfigS3Role, LogType } from '@basemaps/lambda-shared';
import { GdalCogBuilder } from '../gdal/gdal';
import { getResample } from '../gdal/gdal.config';
import { Wgs84ToGoogle } from '../proj';
import { CogJob } from './types';

/**
 * Create a onProgress logger
 *
 * @param keys additional keys to log
 * @param logger base logger to use
 */
export function onProgress(keys: Record<string, any>, logger: LogType): (p: number) => void {
    let lastTime = Date.now();
    return (p: number): void => {
        logger.trace({ ...keys, progress: parseFloat(p.toFixed(2)), progressTime: Date.now() - lastTime }, 'Progress');
        lastTime = Date.now();
    };
}

/**
 * Return the width/height of the quadkey in pixels at the target resolution
 * @param quadKey
 * @param targetResolution
 * @param tileSize (Optional) size of each tile
 */
export function getTileSize(quadKey: string, targetResolution: number, tileSize = 256): number {
    return tileSize * Math.pow(2, targetResolution - quadKey.length + 1);
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

    const bbox = QuadKey.toBbox(quadKey);
    const { forward } = Wgs84ToGoogle;
    const [east, north] = forward(bbox.slice(0, 2));
    const [west, south] = forward(bbox.slice(2));

    const [x, y, z] = QuadKey.toXYZ(quadKey);

    const alignmentLevels = job.source.resolution - z;

    const cogBuild = new GdalCogBuilder(vrtLocation, outputTiffPath, {
        bbox: [east, south, west, north],
        alignmentLevels,
        resampling: getResample(job.output.resample),
    });
    if (cogBuild.gdal.mount) {
        job.source.files.forEach((f) => cogBuild.gdal.mount?.(f));
    }

    cogBuild.gdal.parser.on('progress', onProgress({ quadKey, target: 'tiff' }, logger));

    logger.info(
        {
            imageSize: getTileSize(quadKey, job.source.resolution),
            quadKey,
            tile: { x, y, z },
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
