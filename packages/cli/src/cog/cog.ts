import { EpsgCode, TileMatrixSet } from '@basemaps/geo';
import { Aws, isConfigS3Role, LogType, ProjectionTileMatrixSet } from '@basemaps/shared';
import { GdalCogBuilder } from '../gdal/gdal.cog';
import { GdalCommand } from '../gdal/gdal.command';
import { TilingScheme } from '../gdal/gdal.config';
import { GdalProgressParser } from '../gdal/gdal.progress';
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

/** Return any special tilingSchemes to use for `epsgCode` */
function tilingScheme(epsgCode: EpsgCode): TilingScheme | undefined {
    if (epsgCode === EpsgCode.Nztm2000) return TilingScheme.Nztm2000;
    return undefined;
}

/**
 * Build a COG for a given collection of tiffs
 *
 * @param job the job to process
 * @param name tile name of cog to generate
 * @param vrtLocation Location of the source VRT file
 * @param outputTiffPath Path to where the output tiff will be stored
 * @param logger Logger to use
 * @param execute Whether to actually execute the transformation,
 */
export async function buildCogForName(
    job: CogJob,
    name: string,
    vrtLocation: string,
    outputTiffPath: string,
    logger: LogType,
    execute = false,
): Promise<void> {
    const startTime = Date.now();

    const { resZoom } = job.source;
    const targetPtms = ProjectionTileMatrixSet.get(job.projection);
    const { tms } = targetPtms;

    const tile = TileMatrixSet.nameToTile(name);

    const ul = tms.tileToSource(tile);
    const lr = tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });

    const blockSize = tms.tileSize * targetPtms.blockFactor;
    const alignmentLevels = targetPtms.findAlignmentLevels(tile, job.source.pixelScale);

    const cogBuild = new GdalCogBuilder(vrtLocation, outputTiffPath, {
        bbox: [ul.x, ul.y, lr.x, lr.y],
        projection: targetPtms.tms.projection,
        tilingScheme: tilingScheme(job.projection),
        blockSize,
        targetRes: tms.pixelScale(resZoom),
        alignmentLevels,
        resampling: job.output.resampling,
        quality: job.output.quality,
    });

    onProgress(cogBuild.gdal, { name, target: 'tiff' }, logger);

    logger.info(
        {
            imageSize: targetPtms.getImagePixelWidth(tile, resZoom),
            name,
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
        await cogBuild.convert(logger.child({ name }));
        logger.info({ name, duration: Date.now() - startTime }, 'CogCreated');
    }
}
