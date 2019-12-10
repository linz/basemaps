#!/usr/bin/env node
import { LogConfig, LogType } from '@basemaps/shared';
import * as fs from 'fs';
import * as Mercator from 'global-mercator';
import pLimit from 'p-limit';
import * as path from 'path';
import 'source-map-support/register';
import { CogBuilder, CogBuilderMetadata } from '../builder';
import { GdalCogBuilder } from '../gdal';
import { GdalDocker } from '../gdal.docker';

async function buildVrt(filePath: string, tiffFiles: string[], logger: LogType): Promise<string> {
    const vrtPath = path.join(filePath, '.vrt');
    const vrtWarpedPath = path.join(filePath, '.3857.vrt');

    if (fs.existsSync(vrtPath)) {
        fs.unlinkSync(vrtPath);
    }
    const gdalDocker = new GdalDocker(filePath);

    // TODO -addalpha adds a 2nd alpha layer if one exists
    logger.info({ path: vrtPath }, 'BuildVrt');
    await gdalDocker.run(['gdalbuildvrt', '-addalpha', '-hidenodata', vrtPath, ...tiffFiles]);

    if (fs.existsSync(vrtWarpedPath)) {
        fs.unlinkSync(vrtWarpedPath);
    }

    logger.info({ path: vrtWarpedPath }, 'BuildVrtWarped');
    await gdalDocker.run(['gdalwarp', '-of', 'VRT', '-t_srs', 'EPSG:3857', vrtPath, vrtWarpedPath]);
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

    await gdal.convert();
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

    const Q = pLimit(4);

    const filePath = process.argv[2];
    const maxTiles = parseInt(process.argv[3] ?? '50', 10);
    const files = fs
        .readdirSync(filePath)
        .filter((f: string): boolean => f.toLowerCase().endsWith('.tif') || f.toLowerCase().endsWith('.tiff'))
        .map((f: string): string => path.join(filePath, f));

    const builder = new CogBuilder(5, maxTiles);
    logger.info({ fileCount: files.length }, 'BoundingBox');
    const metadata = await builder.build(files);

    const inputVrt = await buildVrt(filePath, files, logger);

    const outputPath = path.join(filePath, 'cog');
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }

    const coveringBounds: GeoJSON.Feature[] = metadata.covering.map((quadKey: string, index: number) => {
        const bbox = Mercator.googleToBBox(Mercator.quadkeyToGoogle(quadKey));
        return {
            type: 'Feature',
            properties: { name: `covering-${index}`, fill: '#e76868', 'fill-opacity': 0.5 },
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [bbox[0], bbox[1]],
                        [bbox[0], bbox[3]],
                        [bbox[2], bbox[3]],
                        [bbox[2], bbox[1]],
                        [bbox[0], bbox[1]],
                    ],
                ],
            },
        };
    });

    const geoJson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: metadata.bounds,
                properties: {
                    name: 'SourceBounds',
                },
            },
            ...coveringBounds,
        ],
    };

    fs.writeFileSync('./output.geojson', JSON.stringify(geoJson, null, 2));
    logger.info({ count: coveringBounds.length, indexes: metadata.covering.join(', ') }, 'Covered');

    const todo = metadata.covering.map((quadKey: string, index: number) => {
        return Q(async () => {
            const startTime = Date.now();
            logger.info({ quadKey, index }, 'Start');
            await processQuadKey(quadKey, inputVrt, outputPath, metadata, index, logger);
            logger.info({ quadKey, duration: Date.now() - startTime, index }, 'Done');
        });
    });

    Promise.all(todo);
}

main().catch(e => console.error(e));
