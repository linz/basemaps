import * as fs from 'node:fs';

import { ConfigTileSetRaster } from '@basemaps/config';
import { GoogleTms, ImageFormat, Nztm2000QuadTms } from '@basemaps/geo';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import PixelMatch from 'pixelmatch';
import Sharp from 'sharp';

import { ConfigLoader } from '../util/config.loader.js';
import { TileXyz } from '../util/validate.js';
import { TileXyzRaster } from './tile.xyz.raster.js';

interface TestTile extends TileXyz {
  buf?: Buffer;
}

export const TestTiles: TestTile[] = [
  { tileSet: 'health', tileMatrix: GoogleTms, tileType: ImageFormat.Png, tile: { x: 252, y: 156, z: 8 } },
  { tileSet: 'health', tileMatrix: Nztm2000QuadTms, tileType: ImageFormat.Png, tile: { x: 30, y: 33, z: 6 } },
];
const TileSize = 256;

export async function getTestBuffer(test: TestTile): Promise<Buffer> {
  if (Buffer.isBuffer(test.buf)) return test.buf;
  const tile = test.tile;

  const expectedFile = `static/expected_tile_${test.tileMatrix.identifier}_${tile.x}_${tile.y}_z${tile.z}.${test.tileType}`;
  // Initiate test img buffer if not defined
  return await fs.promises.readFile(expectedFile);
}

export async function updateExpectedTile(test: TestTile, newTileData: Buffer, difference: Buffer): Promise<void> {
  const tile = test.tile;

  const expectedFileName = `static/expected_tile_${test.tileMatrix.identifier}_${tile.x}_${tile.y}_z${tile.z}.${test.tileType}`;
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
export async function healthGet(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const config = await ConfigLoader.load(req);
  const tileSet = await config.TileSet.get(config.TileSet.id('health'));
  if (tileSet == null) throw new LambdaHttpResponse(500, 'TileSet: "health" not found');
  for (const test of TestTiles) {
    // Get the parse response tile to raw buffer
    const response = await TileXyzRaster.tile(req, tileSet as ConfigTileSetRaster, test);
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
      req.log.error({ missMatchedPixels, projection: test.tileMatrix.identifier, xyz: test.tile }, 'Health:MissMatch');
      return new LambdaHttpResponse(500, 'TileSet does not match.');
    }
  }

  // Return Ok response when all health test passed.
  const OkResponse = new LambdaHttpResponse(200, 'ok');
  OkResponse.header(HttpHeader.CacheControl, 'no-store');
  return OkResponse;
}
