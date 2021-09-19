import { GoogleTms, Nztm2000QuadTms, Tile, TileMatrixSet } from '@basemaps/geo';
import { ImageFormat } from '@basemaps/tiler';
import { HttpHeader, LambdaAlbRequest, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import * as fs from 'fs';
import * as path from 'path';
import PixelMatch from 'pixelmatch';
import Sharp from 'sharp';
import url from 'url';
import { TileRoute } from './tile.js';

interface TestTile {
    tms: TileMatrixSet;
    buf: null | Buffer;
    format: ImageFormat;
    testTile: Tile;
}

export const TestTiles: TestTile[] = [
    { tms: GoogleTms, format: ImageFormat.PNG, testTile: { x: 252, y: 156, z: 8 }, buf: null },
    { tms: Nztm2000QuadTms, format: ImageFormat.PNG, testTile: { x: 30, y: 33, z: 6 }, buf: null },
];
const TileSize = 256;

export async function getTestBuffer(test: TestTile): Promise<Buffer> {
    if (Buffer.isBuffer(test.buf)) return test.buf;
    const tile = test.testTile;

    const expectedFile = `static/expected_tile_${test.tms.identifier}_${tile.x}_${tile.y}_z${tile.z}.${test.format}`;
    // Initiate test img buffer if not defined
    try {
        return await fs.promises.readFile(expectedFile);
    } catch (e: any) {
        if (e.code !== 'ENOENT') throw e;
        const otherFile = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..', expectedFile);
        return await fs.promises.readFile(otherFile);
    }
}

export async function updateExpectedTile(test: TestTile, newTileData: Buffer, difference: Buffer): Promise<void> {
    const tile = test.testTile;
    const expectedFileName = `static/expected_tile_${test.tms.identifier}_${tile.x}_${tile.y}_z${tile.z}.${test.format}`;
    await fs.promises.writeFile(expectedFileName, newTileData);
    const imgPng = await Sharp(difference, { raw: { width: TileSize, height: TileSize, channels: 4 } })
        .png()
        .toBuffer();
    await fs.promises.writeFile(`${expectedFileName}.diff.png`, imgPng);
}

/**
 * Health request get health TileSets and validate with test TileSets
 * - Valid response from get heath tile request
 * - Valid tile get from the request
 *
 * @throws LambdaHttpResponse for failure health test
 */
export async function Health(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    for (const test of TestTiles) {
        const tms = test.tms;
        const testTile = test.testTile;
        const format = test.format;
        const path = `/v1/tiles/health/${tms.identifier}/${testTile.z}/${testTile.x}/${testTile.y}.${format}`;

        const ctx: LambdaHttpRequest = new LambdaAlbRequest(
            {
                requestContext: null as any,
                httpMethod: 'get',
                path: path,
                body: null,
                isBase64Encoded: false,
            },
            {} as Context,
            req.log,
        );

        // Get the parse response tile to raw buffer
        const response = await TileRoute.tile(ctx);
        if (response.status !== 200) return new LambdaHttpResponse(response.status, response.statusDescription);
        if (!Buffer.isBuffer(response._body)) throw new LambdaHttpResponse(404, 'Not a Buffer response content.');
        const resImgBuffer = await Sharp(response._body).raw().toBuffer();

        // Get test tile to compare
        const testBuffer = await getTestBuffer(test);
        test.buf = testBuffer;
        const testImgBuffer = await Sharp(testBuffer).raw().toBuffer();

        const outputBuffer = Buffer.alloc(testImgBuffer.length);
        const missMatchedPixels = PixelMatch(testImgBuffer, resImgBuffer, outputBuffer, TileSize, TileSize);
        if (missMatchedPixels) {
            /** Uncomment this to overwite the expected files */
            // await updateExpectedTile(test, response._body as Buffer, outputBuffer);
            req.log.error(
                {
                    missMatchedPixels,
                    projection: tms.identifier,
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
