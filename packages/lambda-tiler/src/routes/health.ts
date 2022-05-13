import { GoogleTms, Nztm2000QuadTms, ImageFormat, TileJson } from '@basemaps/geo';
import { TileDataXyz, TileType } from '@basemaps/shared';
import {
  HttpHeader,
  HttpHeaderRequestId,
  LambdaAlbRequest,
  LambdaHttpRequest,
  LambdaHttpResponse,
} from '@linzjs/lambda';
import { ALBEvent } from 'aws-lambda';
import { Context } from 'aws-lambda/handler';
import * as fs from 'fs';
import * as path from 'path';
import PixelMatch from 'pixelmatch';
import Sharp from 'sharp';
import url from 'url';
import { TileSets } from '../tile.set.cache.js';
import { tileJson } from './tile.json.js';

interface TestTile extends TileDataXyz {
  buf?: Buffer;
}

export const TestRasterTiles: TestTile[] = [
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

/** Validate the raster service by creating a number of raster tiles */
export async function healthRaster(req: LambdaHttpRequest): Promise<LambdaHttpResponse | void> {
  for (const test of TestRasterTiles) {
    const tileSet = await TileSets.get('health-raster', test.tileMatrix);
    if (tileSet == null) throw new LambdaHttpResponse(500, 'TileSet: "health-raster" not found');
    // Get the parse response tile to raw buffer
    const response = await tileSet.tile(req, test);
    if (response.status !== 200) return new LambdaHttpResponse(500, response.statusDescription);
    if (!Buffer.isBuffer(response._body)) throw new LambdaHttpResponse(500, 'Raster: Not a Buffer response content.');
    const resImgBuffer = await Sharp(response._body).raw().toBuffer();

    const tileId = `tile_${test.tileMatrix.identifier}_${test.x}_${test.y}_z${test.z}.${test.ext}`;
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
      return new LambdaHttpResponse(500, `Raster: Tile "${tileId}" does not match.`);
    }
  }

  // Validate TileJson for both NZTM and Google
  for (const tileMatrix of [GoogleTms, Nztm2000QuadTms]) {
    const tilePathPrefix = `/v1/tiles/health-raster/${tileMatrix.projection.toEpsgString()}`;
    const tileRequest = createRequest(req, `${tilePathPrefix}/tile.json`);
    const tileJsonResponse = await tileJson(tileRequest);
    if (tileJsonResponse.status !== 200) {
      return new LambdaHttpResponse(500, `Raster.TileJSON: Failed to generate tile.json for ${tileMatrix.identifier}`);
    }
    const tileJsonData: TileJson = loadJson(tileJsonResponse);
    const [tileUrl] = tileJsonData.tiles;
    if (tileUrl == null) {
      return new LambdaHttpResponse(500, `Raster.TileJSON: Missing tileUrl ${tileMatrix.identifier}`);
    }
    if (!tileUrl.endsWith(`.webp?api=c${req.correlationId}`)) {
      return new LambdaHttpResponse(500, `Raster.TileJSON: invalid tileUrl ${tileUrl}`);
    }
  }
}

function loadJson<T>(res: LambdaHttpResponse): T {
  return JSON.parse(res.isBase64Encoded ? Buffer.from(res.body, 'base64').toString() : res.body);
}

/** Create a fake sub request to pass to internal routes */
function createRequest(req: LambdaHttpRequest, path: string): LambdaHttpRequest {
  return new LambdaAlbRequest(
    {
      httpMethod: 'get',
      path: path,
      body: null,
      isBase64Encoded: false,
      // Ensure the sub request has the same trace id
      headers: { [HttpHeaderRequestId.CorrelationId]: req.correlationId },
      queryStringParameters: { api: `c${req.correlationId}` },
    } as unknown as ALBEvent,
    {} as Context,
    req.log,
  );
}

/** Validate vector service is generating tile json  */
export async function healthVector(req: LambdaHttpRequest): Promise<LambdaHttpResponse | void> {
  const tileSet = await TileSets.get('health-vector', GoogleTms);
  if (tileSet == null) throw new LambdaHttpResponse(500, 'TileSet: "health-vector" not found');

  // Validate TileJSON
  const tilePathPrefix = `/v1/tiles/health-vector/${GoogleTms.projection.toEpsgString()}`;
  const tileRequest = createRequest(req, `${tilePathPrefix}/tile.json`);
  const tileJsonResponse = await tileJson(tileRequest);
  if (tileJsonResponse.status !== 200) return new LambdaHttpResponse(500, 'Vector: Failed to generate tile.json');
  const tileJsonData: TileJson = loadJson(tileJsonResponse);

  // Vector tiles should always have a max zoom
  if (tileJsonData.maxzoom == null) return new LambdaHttpResponse(500, 'Vector.TileJSON: missing max zoom');
  // Tiles should always point to a sub path
  const [tileUrl] = tileJsonData.tiles;
  // There should only be one url that is a sub path of the tile.json and should be served as a protobuf file
  if (tileJsonData.tiles.length !== 1 || !tileUrl.startsWith(tilePathPrefix) || !tileUrl.includes('.pbf')) {
    return new LambdaHttpResponse(500, 'Vector.TileJSON: invalid tile path ' + tileUrl);
  }
}

/**
 * Health request get health TileSets and validate with test TileSets
 * - Valid response from get heath tile request
 * - Valid tile get from the request
 *
 * @throws LambdaHttpResponse for failure health test
 */
export async function Health(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const healthChecks = await Promise.all([healthRaster(req), healthVector(req)]);
  const firstFailedCheck = healthChecks.find((f) => f != null);
  if (firstFailedCheck) return firstFailedCheck;

  // Return Ok response when all health test passed.
  const OkResponse = new LambdaHttpResponse(200, 'ok');
  OkResponse.header(HttpHeader.CacheControl, 'no-store');
  return OkResponse;
}
