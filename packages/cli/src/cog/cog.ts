import { QuadKey } from '@basemaps/geo';
import { Aws, isConfigS3Role, LogType, ProjectionTileMatrixSet } from '@basemaps/shared';
import { GdalCogBuilder } from '../gdal/gdal';
import { GdalCommand } from '../gdal/gdal.command';
import { GdalProgressParser } from '../gdal/gdal.progress';
import { SingleTileWidth } from './constants';
import { CogJob } from './types';

/**
 * Create a onProgress logger
 *
 * @param keys additional keys to log
 * @param logger base logger to use
 */
export function onProgress(gdal: GdalCommand, keys: Record<string, any>, logger: LogType): void {
    let lastTime = Date.now();

    gdal.parser = new GdalProgressParser();
    gdal.parser.on('progress', (p: number): void => {
        logger.trace({ ...keys, progress: parseFloat(p.toFixed(2)), progressTime: Date.now() - lastTime }, 'Progress');
        lastTime = Date.now();
    });
}

/**
 * Return the width/height of the quadkey in pixels at the target resolution
 * @param quadKey
 * @param targetZoom The zoom level for the target resolution
 * @param tileSize (Optional) size of each tile. Default is what GDAL creates for Google tiles
 */
export function getTileSize(quadKey: string, targetZoom: number, tileSize = SingleTileWidth): number {
    return tileSize * Math.pow(2, targetZoom - quadKey.length + 1);
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

    const targetProj = ProjectionTileMatrixSet.get(job.projection);

    const tile = QuadKey.toTile(quadKey);

    const ul = targetProj.tms.tileToSource(tile);
    const lr = targetProj.tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });

    const padding = Math.max(Math.abs(lr.y - ul.y), Math.abs(lr.x - ul.x)) * 0.01;

    const alignmentLevels = job.source.resZoom - tile.z;

    const cogBuild = new GdalCogBuilder(vrtLocation, outputTiffPath, {
        bbox: [ul.x, ul.y, lr.x + padding, lr.y - padding],
        alignmentLevels,
        resampling: job.output.resampling,
        quality: job.output.quality,
    });

    onProgress(cogBuild.gdal, { quadKey, target: 'tiff' }, logger);

    logger.info(
        {
            imageSize: getTileSize(quadKey, job.source.resZoom),
            quadKey,
            tile,
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
