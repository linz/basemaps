import { LogType } from '@basemaps/shared';
import * as Mercator from 'global-mercator';
import { GdalCogBuilder } from './gdal';

export interface CogJob {
    /** Unique processing Id */
    id: string;

    source: {
        name: string;
        /** List of input files */
        files: string[];
        /** Lowest quality resolution */
        resolution: number;
        /** VRT creation options */
        vrt: string;
    };

    /** Folder/S3 bucket to store the output */
    output: string;

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
 * @param quadKey QuadKey to generate
 * @param vrtLocation Location of the source VRT file
 * @param sourceTiffs List of tiff files to use
 * @param outputTiffPath Path to where the output tiff will be stored
 * @param resolution Resolution of the tiff files in Web Mercator zoom
 * @param logger Logger to use
 * @param execute Whether to actually execute the transformation,
 */
export async function buildCogForQuadKey(
    quadKey: string,
    vrtLocation: string,
    sourceTiffs: string[],
    outputTiffPath: string,
    resolution: number,
    logger: LogType,
    execute = false,
): Promise<void> {
    const startTime = Date.now();
    const google = Mercator.quadkeyToGoogle(quadKey);
    const [minX, minY, maxX, maxY] = Mercator.googleToBBoxMeters(google);
    const alignmentLevels = resolution - google[2];

    const cogBuild = new GdalCogBuilder(vrtLocation, outputTiffPath, {
        bbox: [minX, maxY, maxX, minY],
        alignmentLevels,
    });
    sourceTiffs.forEach(f => cogBuild.gdal.mount(f));

    cogBuild.gdal.parser.on('progress', onProgress({ quadKey, target: 'tiff' }, logger));

    logger.info(
        {
            quadKey,
            tile: { x: google[0], y: google[1], z: google[2] },
            alignmentLevels,
        },
        'CreateCog',
    );

    logger.debug({ cmd: cogBuild.args.join(' ') }, 'GdalTranslate');

    if (execute) {
        await cogBuild.convert(logger.child({ quadKey }));
        logger.info({ quadKey, duration: Date.now() - startTime }, 'CogCreated');
    }
}
