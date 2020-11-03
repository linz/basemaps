import * as fs from 'fs';
import * as path from 'path';
import PixelMatch = require('pixelmatch');
import { Epsg, Tile } from '@basemaps/geo';
import { LambdaHttpResponse, LambdaContext, HttpHeader } from '@basemaps/lambda';
import { LogConfig } from '@basemaps/shared';
import { ImageFormat } from '@basemaps/tiler';
import { PNG } from 'pngjs';
import { tile } from './tile';

function getExpectedTileName(projection: Epsg, tile: Tile, format: ImageFormat): string {
    return path.join(
        __dirname,
        '..',
        '..',
        `static/expected_tile_${projection.code}_${tile.x}_${tile.y}_z${tile.z}.${format}`,
    );
}

const TestTiles = [
    { projection: Epsg.Google, format: ImageFormat.PNG, testTile: { x: 30, y: 30, z: 6 } },
    { projection: Epsg.Google, format: ImageFormat.PNG, testTile: { x: 0, y: 1, z: 1 } },
    { projection: Epsg.Google, format: ImageFormat.PNG, testTile: { x: 15, y: 10, z: 4 } },
];

/**
 * Health request get health TileSets and validate with test TileSets
 * - Valid response from get heath tile request
 * - Valid tile get from the request
 *
 * @throws LambdaHttpResponse for failure health test
 */
export async function Health(): Promise<LambdaHttpResponse> {
    for (let i = 0; i < TestTiles.length; i++) {
        const projection = TestTiles[i].projection;
        const testTile = TestTiles[i].testTile;
        const format = TestTiles[i].format;
        const path = `/v1/tiles/health@head/EPSG:${projection}/${testTile.z}/${testTile.x}/${testTile.y}.${format}`;
        const ctx: LambdaContext = new LambdaContext(
            {
                requestContext: null as any,
                httpMethod: 'get',
                path: path,
                body: null,
                isBase64Encoded: false,
            },
            LogConfig.get(),
        );

        // Get the test tiles to compare
        const response = await tile(ctx);
        if (response.status != 200) throw new LambdaHttpResponse(response.status, response.statusDescription);
        const resImgBuffer = PNG.sync.read(response.body as Buffer);
        const testTileName = getExpectedTileName(projection, testTile, format);
        const testTileFile = fs.readFileSync(testTileName);
        const testImgBuffer = PNG.sync.read(testTileFile);
        const missMatchedPixels = PixelMatch(testImgBuffer.data, resImgBuffer.data, null, 256, 256);
        if (missMatchedPixels) throw new LambdaHttpResponse(404, 'Test tile not match.');
    }

    // Return Ok response when all health test passed.
    const OkResponse = new LambdaHttpResponse(200, 'ok');
    OkResponse.header(HttpHeader.CacheControl, 'no-store');
    return OkResponse;
}
