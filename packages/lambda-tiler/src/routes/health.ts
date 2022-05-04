import { GoogleTms, Nztm2000QuadTms, ImageFormat } from '@basemaps/geo';
import { TileDataXyz, TileType } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import * as fs from 'fs';
import * as path from 'path';
import PixelMatch from 'pixelmatch';
import Sharp from 'sharp';
import url from 'url';
import { TileSets } from '../tile.set.cache.js';

interface TestTile extends TileDataXyz {
  buf?: Buffer;
}

export const TestTiles: TestTile[] = [
  { type: TileType.Tile, name: 'health', tileMatrix: GoogleTms, ext: ImageFormat.Png, x: 252, y: 156, z: 8 },
  { type: TileType.Tile, name: 'health', tileMatrix: Nztm2000QuadTms, ext: ImageFormat.Png, x: 30, y: 33, z: 6 },
];
const TileSize = 256;

export async function getTestBuffer(test: TestTile): Promise<Buffer> {
  if (Buffer.isBuffer(test.buf)) return test.buf;

  const expectedFile = `static/expected_tile_${test.tileMatrix.identifier}_${test.x}_${test.y}_z${test.z}.${test.ext}`;
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
  const expectedFileName = `static/expected_tile_${test.tileMatrix.identifier}_${test.x}_${test.y}_z${test.z}.${test.ext}`;
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
    const tileSet = await TileSets.get('health', test.tileMatrix);
    if (tileSet == null) throw new LambdaHttpResponse(500, 'TileSet: "health" not found');
    // Get the parse response tile to raw buffer
    const response = await tileSet.tile(req, test);
    if (response.status !== 200) return new LambdaHttpResponse(500, response.statusDescription);
    if (!Buffer.isBuffer(response._body)) throw new LambdaHttpResponse(500, 'Not a Buffer response content.');
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
        { missMatchedPixels, projection: test.tileMatrix.identifier, xyz: { x: test.x, y: test.y, z: test.z } },
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
