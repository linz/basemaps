#!/usr/bin/env node
import { LogConfig, LogType, GeoJson, Projection, EPSG, Env } from '@basemaps/shared';
import * as fs from 'fs';
import * as Mercator from 'global-mercator';
import pLimit from 'p-limit';
import * as path from 'path';
import 'source-map-support/register';
import { CogBuilder, CogBuilderMetadata } from '../builder';
import { GdalCogBuilder } from '../gdal';
import { GdalDocker } from '../gdal.docker';
import { createHash } from 'crypto';

// At most TiffConcurrency will be built at one time.
const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 4));

const isDryRun = (): boolean => process.argv.indexOf('--commit') == -1;

interface VrtOptions {
    /** Vrts will add a second alpha layer if one exists, so dont always add one */
    addAlpha: boolean;
    /** No need to force a reprojection to 3857 if source imagery is in 3857 */
    forceEpsg3857: boolean;
}

async function buildVrt(filePath: string, tiffFiles: string[], options: VrtOptions, logger: LogType): Promise<string> {
    // Create a somewhat unique name for the vrts
    const vrtName = createHash('sha256')
        .update(tiffFiles.join(''))
        .digest('hex');

    const vrtPath = path.join(filePath, `.__${vrtName}.vrt`);
    const vrtWarpedPath = path.join(filePath, `.__${vrtName}.epsg${EPSG.Google}.vrt`);

    if (fs.existsSync(vrtPath)) {
        fs.unlinkSync(vrtPath);
    }
    const gdalDocker = new GdalDocker(filePath);

    logger.info({ path: vrtPath }, 'BuildVrt');
    if (isDryRun()) {
        return vrtWarpedPath;
    }

    // -addalpha adds a 2nd alpha layer if one exists
    const buildVrtCmd = ['gdalbuildvrt', '-hidenodata'];
    if (options.addAlpha) {
        buildVrtCmd.push('-addalpha');
    }
    await gdalDocker.run([...buildVrtCmd, vrtPath, ...tiffFiles], logger);

    /** Force a reprojection to 3857 if required */
    if (!options.forceEpsg3857) {
        return vrtPath;
    }

    if (fs.existsSync(vrtWarpedPath)) {
        fs.unlinkSync(vrtWarpedPath);
    }

    logger.info({ path: vrtWarpedPath }, 'BuildVrt:Warped');
    await gdalDocker.run(
        ['gdalwarp', '-of', 'VRT', '-t_srs', Projection.toEpsgString(EPSG.Google), vrtPath, vrtWarpedPath],
        logger,
    );
    return vrtWarpedPath;
}

async function processQuadKey(
    quadKey: string,
    source: string,
    target: string,
    metadata: CogBuilderMetadata,
    index: number,
    logger: LogType,
): Promise<void> {
    let startTime = Date.now();
    const google = Mercator.quadkeyToGoogle(quadKey);
    const [minX, minY, maxX, maxY] = Mercator.googleToBBoxMeters(google);
    const alignmentLevels = metadata.resolution - google[2];

    const gdal = new GdalCogBuilder(source, path.join(target, `${quadKey}.tiff`), {
        bbox: [minX, maxY, maxX, minY],
        alignmentLevels,
    });

    gdal.gdal.parser.on('progress', p => {
        logger.debug(
            { quadKey, target: gdal.target, progress: p.toFixed(2), progressTime: Date.now() - startTime, index },
            'Progress',
        );
        startTime = Date.now();
    });

    logger.debug(
        {
            quadKey,
            tile: { x: google[0], y: google[1], z: google[2] },
            alignmentLevels,
            cmd: 'docker ' + gdal.args.join(' '),
        },
        'GdalTranslate',
    );

    if (!isDryRun()) {
        await gdal.convert(logger.child({ quadKey }));
    }
}

/**
 * Dump a covering for a folder full of tiffs
 */
export async function main(): Promise<void> {
    const logger = LogConfig.get();
    if (process.argv.length < 3) {
        console.error('Usage: ./cli.js <tiff-path> <max-tiles>');
        return;
    }
    if (isDryRun()) {
        logger.warn('DryRun');
    } else {
        logger.warn('Commit');
    }

    const filePath = process.argv[2];
    const maxTiles = parseInt(process.argv[3] ?? '50', 10);
    const files = fs
        .readdirSync(filePath)
        .filter((f: string): boolean => f.toLowerCase().endsWith('.tif') || f.toLowerCase().endsWith('.tiff'))
        .map((f: string): string => path.join(filePath, f));

    const builder = new CogBuilder(5, maxTiles);
    logger.info({ tiffCount: files.length }, 'CreateBoundingBox');
    const metadata = await builder.build(files);

    const vrtOptions = { addAlpha: true, forceEpsg3857: true };

    // -addalpha to vrt adds extra alpha layers even if one already exist
    if (metadata.bands > 3) {
        logger.warn({ bandCount: metadata.bands }, 'Vrt:DetectedAlpha, Disabling -addalpha');
        vrtOptions.addAlpha = false;
    }

    // If the source imagery is in 900931, no need to force a warp
    if (metadata.projection == EPSG.Google) {
        logger.warn({ bandCount: metadata.bands }, 'Vrt:GoogleProjection, Disabling warp');
        vrtOptions.forceEpsg3857 = false;
    }

    const inputVrt = await buildVrt(filePath, files, vrtOptions, logger);

    const outputPath = path.join(filePath, 'cog');
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }

    const coveringBounds: GeoJSON.Feature[] = metadata.covering.map((quadKey: string, index: number) => {
        const bbox = Mercator.googleToBBox(Mercator.quadkeyToGoogle(quadKey));
        return GeoJson.toFeaturePolygon(GeoJson.toPositionPolygon(bbox), {
            name: `covering-${index}`,
            fill: '#e76868',
            'fill-opacity': 0.5,
        });
    });

    const geoJson: GeoJSON.FeatureCollection = GeoJson.toFeatureCollection([
        ...metadata.bounds.features,
        ...coveringBounds,
    ]);
    fs.writeFileSync('./output.geojson', JSON.stringify(geoJson, null, 2));
    logger.info({ count: coveringBounds.length, indexes: metadata.covering.join(', ') }, 'Covered');

    const todo = metadata.covering.map((quadKey: string, index: number) => {
        return LoadingQueue(async () => {
            const startTime = Date.now();
            logger.info({ quadKey, index }, 'Start');
            await processQuadKey(quadKey, inputVrt, outputPath, metadata, index, logger);
            logger.info({ quadKey, duration: Date.now() - startTime, index }, 'Done');
        });
    });

    Promise.all(todo);
}

main().catch(e => console.error(e));
