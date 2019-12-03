#!/usr/bin/env node
import { LogConfig, LogType } from '@basemaps/shared';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as Mercator from 'global-mercator';
import * as path from 'path';
import 'source-map-support/register';
import { CogBuilder, CogBuilderMetadata } from '../builder';
import { GdalCogBuilder } from '../gdal';
import pLimit from 'p-limit';

async function processQuadKey(
    quadKey: string,
    filePath: string,
    metadata: CogBuilderMetadata,
    logger: LogType,
): Promise<void> {
    const startTime = Date.now();
    const google = Mercator.quadkeyToGoogle(quadKey);
    const [minX, minY, maxX, maxY] = Mercator.googleToBBoxMeters(google);
    const alignmentLevels = metadata.resolution - google[2];
    const gdal = new GdalCogBuilder(
        filePath + '.3857.vrt',
        `${filePath}.${quadKey}.cog.${randomBytes(6).toString('hex')}.tiff`,
        {
            bbox: [minX, maxY, maxX, minY],
            alignmentLevels, // TODO this level should be calculated from tile - best image zoom level
        },
    );

    gdal.parser.on('progress', p =>
        logger.info(
            { quadKey, target: gdal.target, progress: p.toFixed(2), duration: Date.now() - startTime },
            'Progress',
        ),
    );

    logger.info(
        {
            quadKey,
            tile: { x: google[0], y: google[1], z: google[2] },
            alignmentLevels,
            cmd: 'docker ' + gdal.args.join(' '),
        },
        'command',
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
    const metadata = await builder.build(files);

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

    const todo = metadata.covering.map(async quadKey => {
        return await Q(() => processQuadKey(quadKey, filePath, metadata, logger));
    });

    Promise.all(todo);
}

main().catch(e => console.error(e));
