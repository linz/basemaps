#!/usr/bin/env node
import 'source-map-support/register';

import * as fs from 'fs';
import * as path from 'path';
import { CogBuilder } from '../builder';
import { TileCover } from '../cover';

import { LogConfig } from '@basemaps/shared';
import { GdalCogBuilder } from '../gdal';
import * as Mercator from 'global-mercator';
import { randomBytes } from 'crypto';

/**
 * Dump a covering for a folder full of tiffs
 */
export async function main(): Promise<void> {
    const logger = LogConfig.get();
    if (process.argv.length < 3) {
        console.error('Usage: ./cli.js <tiff-path> <max-tiles>');
        return;
    }

    const filePath = process.argv[2];
    const maxTiles = parseInt(process.argv[3] ?? '50', 10);
    const files = fs
        .readdirSync(filePath)
        .filter((f: string): boolean => f.toLowerCase().endsWith('.tif') || f.toLowerCase().endsWith('.tiff'))
        .map((f: string): string => path.join(filePath, f));

    const builder = new CogBuilder(5);
    const geometry = await builder.bounds(files);
    const covering = TileCover.cover(geometry, 1, 13, maxTiles);
    const coveringBounds: GeoJSON.Feature[] = covering.map((quadKey: string, index: number) => {
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
                geometry,
                properties: {
                    name: 'SourceBounds',
                },
            },
            ...coveringBounds,
        ],
    };

    fs.writeFileSync('./output.geojson', JSON.stringify(geoJson, null, 2));
    logger.info({ count: coveringBounds.length, indexes: covering.join(', ') }, 'Covered');

    for (const quadKey of covering) {
        const startTime = Date.now();
        const google = Mercator.quadkeyToGoogle(quadKey);
        const [minX, minY, maxX, maxY] = Mercator.googleToBBoxMeters(google);
        const gdal = new GdalCogBuilder(
            filePath + '.3857.vrt',
            `${filePath}.${quadKey}.cog.${randomBytes(6).toString('hex')}.tiff`,
            {
                bbox: [minX, maxY, maxX, minY],
                alignmentLevels: 6, // TODO this level should be calculated from tile - best image zoom level
            },
        );

        gdal.parser.on('progress', p =>
            logger.info({ target: gdal.target, progress: p.toFixed(2), duration: Date.now() - startTime }, 'Progress'),
        );

        // await gdal.convert();
        logger.info({ cmd: 'docker ' + gdal.args.join(' ') }, 'command');
    }
}

main().catch(e => console.error(e));
