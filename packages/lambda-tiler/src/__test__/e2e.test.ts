import fetch from 'node-fetch';
import o from 'ospec';
import * as path from 'path';
import { readFileSync } from 'fs';
import { ImageFormat } from '@basemaps/tiler';
import { Epsg, Tile } from '@basemaps/geo';
import { getApiKey } from '@basemaps/shared';

function getExpectedTileName(projection: Epsg, tile: Tile, format: ImageFormat): string {
    return path.join(
        __dirname,
        '..',
        '..',
        `static/expected_tile_${projection.code}_${tile.x}_${tile.y}_z${tile.z}.${format}`,
    );
}

o.spec('E2E test for lambda-tiler', () => {
    const ApiKey = getApiKey();
    const baseUrl = 'https://dev.basemaps.linz.govt.nz';

    o('should return version', async () => {
        o.timeout(5 * 1000);

        // Given ... a get version request
        const getVersionUrl = baseUrl + '/v1/version' + '?api=' + ApiKey;

        // When ...
        const response = await fetch(getVersionUrl);

        // Then ...
        o(response.status).equals(200);
        o(response.statusText).equals('OK');
        const ResponseJson = await response.json();
        const ResponseVersion = ResponseJson.version.split('-')[0];
        const packageJson = require('../../package.json');
        const packageVersion = 'v' + packageJson.version;
        o(ResponseVersion).equals(packageVersion);
    });

    // TODO: More tests to add here.
    const TestTiles = [
        { projection: Epsg.Google, format: ImageFormat.WEBP, tile: { x: 1013, y: 629, z: 10 } },
        // { projection: Epsg.Google, format: ImageFormat.PNG, tile: { x: 5, y: 8, z: 2 } },
        // { projection: Epsg.Nztm2000, format: ImageFormat.JPEG, tile: { x: 6, y: 8, z: 2 } }
    ];

    TestTiles.forEach(({ projection, format, tile }) => {
        const getTile = `/v1/tiles/aerial/EPSG:${projection}/${tile.z}/${tile.x}/${tile.y}.${format}`;
        o('should return valid tiles from request', async () => {
            o.timeout(5 * 1000);

            // Given ... a get tile request
            const getTileUrl = baseUrl + getTile + '?api=' + ApiKey;

            // When ...
            const response = await fetch(getTileUrl);
            const buffer = await response.buffer();

            // Then ...
            o(response.status).equals(200);
            o(response.statusText).equals('OK');

            const fileName = getExpectedTileName(projection, tile, format);
            const bytes = readFileSync(fileName);
            o(buffer).deepEquals(bytes);
        });
    });
});
