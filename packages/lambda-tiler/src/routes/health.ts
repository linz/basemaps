import * as fs from 'node:fs';

import { ConfigTileSetRaster, ConfigTileSetVector, TileSetType } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { VectorTile } from '@mapbox/vector-tile';
import Protobuf from 'pbf';
import PixelMatch from 'pixelmatch';
import Sharp from 'sharp';
import { gunzipSync } from 'zlib';

import { ConfigLoader } from '../util/config.loader.js';
import { isGzip } from '../util/cotar.serve.js';
import { TileXyz } from '../util/validate.js';
import { TileXyzRaster } from './tile.xyz.raster.js';
import { tileXyzVector } from './tile.xyz.vector.js';

/**
 * Vector feature that need to check existence
 */
export interface TestFeature {
  layer: string;
  key: string;
  value: string;
}

interface TestTile extends TileXyz {
  buf?: Buffer;
  testFeatures?: TestFeature[];
}

export const TestTiles: TestTile[] = [
  { tileSet: 'health', tileMatrix: GoogleTms, tileType: 'png', tile: { x: 252, y: 156, z: 8 } },
  { tileSet: 'health', tileMatrix: Nztm2000QuadTms, tileType: 'png', tile: { x: 30, y: 33, z: 6 } },
  {
    tileSet: 'topographic',
    tileMatrix: GoogleTms,
    tileType: 'pbf',
    tile: { x: 1009, y: 641, z: 10 },
    testFeatures: [
      { layer: 'aeroway', key: 'name', value: 'Wellington Airport' },
      { layer: 'place', key: 'name', value: 'Wellington' },
      { layer: 'coastline', key: 'class', value: 'coastline' },
      { layer: 'landcover', key: 'class', value: 'grass' },
      { layer: 'poi', key: 'name', value: 'Seatoun Wharf' },
      { layer: 'transportation', key: 'name', value: 'Mt Victoria Tunnel' },
    ],
  },
  {
    tileSet: 'topographic',
    tileMatrix: GoogleTms,
    tileType: 'pbf',
    tile: { x: 62, y: 40, z: 6 },
    testFeatures: [
      { layer: 'landuse', key: 'name', value: 'Queenstown' },
      { layer: 'place', key: 'name', value: 'Christchurch' },
      { layer: 'water', key: 'name', value: 'Tasman Lake' },
      { layer: 'coastline', key: 'class', value: 'coastline' },
      { layer: 'landcover', key: 'class', value: 'wood' },
      { layer: 'transportation', key: 'name', value: 'STATE HIGHWAY 6' },
    ],
  },
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
 * Compare and validate the raster test tile from server with pixel match
 */
async function validateRasterTile(tileSet: ConfigTileSetRaster, test: TestTile, req: LambdaHttpRequest): Promise<void> {
  // Get the parse response tile to raw buffer
  const response = await TileXyzRaster.tile(req, tileSet, test);
  if (response.status !== 200) throw new LambdaHttpResponse(500, response.statusDescription);
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
    throw new LambdaHttpResponse(500, 'TileSet does not match.');
  }
}

function checkFeatureExists(tile: VectorTile, testFeature: TestFeature): boolean {
  const layer = tile.layers[testFeature.layer];
  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i);
    if (feature.properties[testFeature.key] === testFeature.value) return true;
  }
  return false;
}

/**
 * Check the existence of a feature property in side the vector tile
 *
 * @throws LambdaHttpResponse if any test feature not found from vector tile
 */
function featureCheck(tile: VectorTile, testTile: TestTile): void {
  const testTileName = `${testTile.tileSet}-${testTile.tile.x}/${testTile.tile.y}/z${testTile.tile.z}`;
  if (testTile.testFeatures == null) {
    throw new LambdaHttpResponse(500, `No test feature found from testTile: ${testTileName}`);
  }
  for (const testFeature of testTile.testFeatures) {
    if (!checkFeatureExists(tile, testFeature)) {
      throw new LambdaHttpResponse(500, `Failed to validate tile: ${testTileName} for layer: ${testFeature.layer}.`);
    }
  }
}

/**
 * Health check the test vector tiles that contains all the expected features.
 *
 * @throws LambdaHttpResponse if test tiles not returned or features not exists
 */
async function validateVectorTile(tileSet: ConfigTileSetVector, test: TestTile, req: LambdaHttpRequest): Promise<void> {
  // Get the parse response tile to raw buffer
  const response = await tileXyzVector.tile(req, tileSet, test);
  if (response.status !== 200) throw new LambdaHttpResponse(500, response.statusDescription);
  if (!Buffer.isBuffer(response._body)) throw new LambdaHttpResponse(500, 'Not a Buffer response content.');
  const buffer = isGzip(response._body) ? gunzipSync(response._body) : response._body;
  const tile = new VectorTile(new Protobuf(buffer));
  featureCheck(tile, test);
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
  for (const test of TestTiles) {
    const tileSet = await config.TileSet.get(config.TileSet.id(test.tileSet));
    if (tileSet == null) throw new LambdaHttpResponse(500, `TileSet: ${test.tileSet} not found`);
    if (tileSet.type === TileSetType.Raster) {
      await validateRasterTile(tileSet, test, req);
    } else if (tileSet.type === TileSetType.Vector) {
      await validateVectorTile(tileSet, test, req);
    } else {
      throw new LambdaHttpResponse(500, `Invalid TileSet type for tileSet ${test.tileSet}`);
    }
  }

  // Return Ok response when all health test passed.
  const OkResponse = new LambdaHttpResponse(200, 'ok');
  OkResponse.header(HttpHeader.CacheControl, 'no-store');
  return OkResponse;
}
