import * as fs from 'fs';
import * as path from 'path';
import Sharp from 'sharp';
import PixelMatch = require('pixelmatch');
import { Epsg, Tile } from '@basemaps/geo';
import { LambdaHttpResponse, LambdaContext, HttpHeader } from '@basemaps/lambda';
import { ImageFormat } from '@basemaps/tiler';
import { tile } from './tile';

export function getExpectedTileName(projection: Epsg, tile: Tile, format: ImageFormat): string {
    return path.join(
        __dirname,
        '..',
        '..',
        `static/expected_tile_${projection.code}_${tile.x}_${tile.y}_z${tile.z}.${format}`,
    );
}

export const TestTiles = [
    { projection: Epsg.Google, format: ImageFormat.PNG, testTile: { x: 252, y: 156, z: 8 }, buf: null as any },
    { projection: Epsg.Google, format: ImageFormat.PNG, testTile: { x: 8073, y: 5130, z: 13 }, buf: null as any },
    { projection: Epsg.Google, format: ImageFormat.PNG, testTile: { x: 32294, y: 20521, z: 15 }, buf: null as any },
];

/**
 * Health request get health TileSets and validate with test TileSets
 * - Valid response from get heath tile request
 * - Valid tile get from the request
 *
 * @throws LambdaHttpResponse for failure health test
 */
export async function Health(req: LambdaContext): Promise<LambdaHttpResponse> {
    for (const test of TestTiles) {
        const projection = test.projection;
        const testTile = test.testTile;
        const format = test.format;
        const path = `/v1/tiles/health/
            ${projection.toEpsgString()}
            /${testTile.z}
            /${testTile.x}
            /${testTile.y}
            .${format}`;

        const ctx: LambdaContext = new LambdaContext(
            {
                requestContext: null as any,
                httpMethod: 'get',
                path: path,
                body: null,
                isBase64Encoded: false,
            },
            req.log,
        );

        // Get the parse response tile to raw buffer
        const response = await tile(ctx);
        if (response.status != 200) return new LambdaHttpResponse(response.status, response.statusDescription);
        const resImgBuffer = await Sharp(response.body as Buffer)
            .png()
            .raw()
            .toBuffer();

        // Get test tile to compare
        if (!test.buf) {
            const testTileName = getExpectedTileName(projection, testTile, format);
            test.buf = await fs.promises.readFile(testTileName);
        }
        const testImgBuffer = await Sharp(test.buf as Buffer)
            .png()
            .raw()
            .toBuffer();

        const missMatchedPixels = PixelMatch(testImgBuffer, resImgBuffer, null, 256, 256);
        if (missMatchedPixels) return new LambdaHttpResponse(404, 'Test TileSet not match.');
    }

    // Return Ok response when all health test passed.
    const OkResponse = new LambdaHttpResponse(200, 'ok');
    OkResponse.header(HttpHeader.CacheControl, 'no-store');
    return OkResponse;
}
