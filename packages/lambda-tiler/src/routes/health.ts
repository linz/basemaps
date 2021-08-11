import * as fs from 'fs';
import * as path from 'path';
import Sharp from 'sharp';
import PixelMatch = require('pixelmatch');
import { Epsg, Tile } from '@basemaps/geo';
import { LambdaHttpResponse, LambdaContext, HttpHeader } from '@basemaps/lambda';
import { ImageFormat } from '@basemaps/tiler';
import { tile } from './tile';

export function getExpectedTileName(projection: Epsg, tile: Tile, format: ImageFormat): string {
    // Bundle static files are at the same directory with index.js
    const dir = __filename.endsWith('health.js') ? path.join(__dirname, '..', '..') : __dirname;
    return path.join(dir, `static/expected_tile_${projection.code}_${tile.x}_${tile.y}_z${tile.z}.${format}`);
}

interface TestTile {
    projection: Epsg;
    buf: null | Buffer;
    format: ImageFormat;
    testTile: Tile;
}

export const TestTiles: TestTile[] = [
    { projection: Epsg.Google, format: ImageFormat.PNG, testTile: { x: 252, y: 156, z: 8 }, buf: null },
    { projection: Epsg.Nztm2000, format: ImageFormat.PNG, testTile: { x: 153, y: 255, z: 7 }, buf: null },
];
const TileSize = 256;

async function getTestBuffer(testTile: TestTile): Promise<Buffer> {
    if (Buffer.isBuffer(testTile.buf)) return testTile.buf;
    // Initiate test img buffer if not defined
    const testTileName = getExpectedTileName(testTile.projection, testTile.testTile, testTile.format);
    testTile.buf = await fs.promises.readFile(testTileName);
    return testTile.buf;
}

//
// async function updateExpectedTile(test: TestTile, newTileData: Buffer, difference: Buffer): Promise<void> {
//     const expectedFileName = getExpectedTileName(test.projection, test.testTile, test.format);
//     await fs.promises.writeFile(expectedFileName, newTileData);
//     const imgPng = await Sharp(difference, { raw: { width: TileSize, height: TileSize, channels: 4 } })
//         .png()
//         .toBuffer();
//     await fs.promises.writeFile(`${expectedFileName}.diff.png`, imgPng);
// }

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
        if (response.status !== 200) return new LambdaHttpResponse(response.status, response.statusDescription);
        if (!Buffer.isBuffer(response.body)) throw new LambdaHttpResponse(404, 'Not a Buffer response content.');
        const resImgBuffer = await Sharp(response.body).raw().toBuffer();

        // Get test tile to compare
        const testBuffer = await getTestBuffer(test);
        const testImgBuffer = await Sharp(testBuffer).raw().toBuffer();

        const outputBuffer = Buffer.alloc(testImgBuffer.length);
        const missMatchedPixels = PixelMatch(testImgBuffer, resImgBuffer, outputBuffer, TileSize, TileSize);
        if (missMatchedPixels) {
            /** Uncomment this to overwite the expected files */
            // await updateExpectedTile(test, response.body, outputBuffer);
            req.log.error(
                {
                    missMatchedPixels,
                    projection: test.projection.code,
                    xyz: test.testTile,
                },
                'Health:MissMatch',
            );
            return new LambdaHttpResponse(500, 'TileSet does not match.');
        }
    }

    // Return Ok response when all health test passed.
    const OkResponse = new LambdaHttpResponse(200, 'ok');
    OkResponse.header(HttpHeader.CacheControl, 'no-store');
    return OkResponse;
}
