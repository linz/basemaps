import o from 'ospec';
import fetch from 'node-fetch';
import * as path from 'path';
import * as fs from 'fs';
import PixelMatch = require('pixelmatch');
import { PNG } from 'pngjs';
import { Epsg, Tile } from '@basemaps/geo';
import { getApiKey } from '@basemaps/shared';
import { ImageFormat } from '@basemaps/tiler';

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
        const packagePath = path.join(__dirname, '..', '..', 'package.json');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const packageJson = require(packagePath);
        const packageVersion = 'v' + packageJson.version;
        o(ResponseVersion).equals(packageVersion);
    });

    // TODO: More tests to add here.
    const TestTiles = [
        { projection: Epsg.Google, format: ImageFormat.PNG, tile: { x: 30, y: 30, z: 6 } },
        { projection: Epsg.Google, format: ImageFormat.PNG, tile: { x: 0, y: 1, z: 1 } },
        { projection: Epsg.Google, format: ImageFormat.PNG, tile: { x: 15, y: 10, z: 4 } },
    ];

    TestTiles.forEach(({ projection, format, tile }) => {
        const imgId = '01EDMTM3P563P06TWYQAZRA9F6';
        const getTile = `/v1/tiles/${imgId}/EPSG:${projection}/${tile.z}/${tile.x}/${tile.y}.${format}`;
        o(`should return valid tiles: x${tile.x} y${tile.y} z${tile.z} projection: ${projection}`, async () => {
            o.timeout(5 * 1000);

            // Given ... a get tile request
            const getTileUrl = baseUrl + getTile + '?api=' + ApiKey;

            // When ...
            const response = await fetch(getTileUrl);
            const buffer = await response.buffer();
            const resImg = PNG.sync.read(buffer);

            // Then ...
            o(response.status).equals(200);
            o(response.statusText).equals('OK');
            const fileName = getExpectedTileName(projection, tile, format);
            const bytes = fs.readFileSync(fileName);
            const testImg = PNG.sync.read(bytes);
            const missMatchedPixels = PixelMatch(testImg.data, resImg.data, null, 256, 256);
            o(missMatchedPixels).equals(0);
        });
    });
});
