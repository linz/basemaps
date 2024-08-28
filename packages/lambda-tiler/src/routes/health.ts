import * as fs from 'node:fs';

import { ConfigTileSetRaster, ConfigTileSetVector, TileSetType } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { VectorTile, VectorTileLayer } from '@mapbox/vector-tile';
import Protobuf from 'pbf';
import PixelMatch from 'pixelmatch';
import Sharp from 'sharp';
import { gunzipSync } from 'zlib';

import { ConfigLoader } from '../util/config.loader.js';
import { isGzip } from '../util/cotar.serve.js';
import { TileXyz } from '../util/validate.js';
import { TileXyzRaster } from './tile.xyz.raster.js';
import { tileXyzVector } from './tile.xyz.vector.js';

interface TestTile extends TileXyz {
  buf?: Buffer;
  location?: string;
}

export const TestTiles: TestTile[] = [
  { tileSet: 'health', tileMatrix: GoogleTms, tileType: 'png', tile: { x: 252, y: 156, z: 8 } },
  { tileSet: 'health', tileMatrix: Nztm2000QuadTms, tileType: 'png', tile: { x: 30, y: 33, z: 6 } },
  {
    tileSet: 'topographic',
    tileMatrix: GoogleTms,
    tileType: 'pbf',
    tile: { x: 1009, y: 641, z: 10 },
    location: 'Wellington',
  },
  {
    tileSet: 'topographic',
    tileMatrix: GoogleTms,
    tileType: 'pbf',
    tile: { x: 62, y: 40, z: 6 },
    location: 'South Island',
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

async function validateRasterTile(
  tileSet: ConfigTileSetRaster,
  test: TestTile,
  req: LambdaHttpRequest,
): Promise<LambdaHttpResponse | undefined> {
  // Get the parse response tile to raw buffer
  const response = await TileXyzRaster.tile(req, tileSet, test);
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
  return;
}

function propertyCheck(layer: VectorTileLayer, key: string, value: string): boolean {
  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i);
    if (feature.properties[key] === value) return true;
  }
  return false;
}

function validateWellingtonTile(tile: VectorTile): LambdaHttpResponse | undefined {
  // Validate Airport Label
  if (!propertyCheck(tile.layers['aeroway'], 'name', 'Wellington Airport')) {
    return new LambdaHttpResponse(500, 'Failed to find Wellington Airport from test tile.');
  }
  // Validate Place Label
  if (!propertyCheck(tile.layers['place'], 'name', 'Wellington')) {
    return new LambdaHttpResponse(500, 'Failed to find Wellington label from test tile.');
  }

  // Validate Coastline Exists
  if (!propertyCheck(tile.layers['coastline'], 'class', 'coastline')) {
    return new LambdaHttpResponse(500, 'Failed to find Coastline from test tile.');
  }

  // Validate Transportation
  if (!propertyCheck(tile.layers['landcover'], 'class', 'grass')) {
    return new LambdaHttpResponse(500, 'Failed to find grass landcover from test tile.');
  }

  // Validate Poi
  if (!propertyCheck(tile.layers['poi'], 'name', 'Seatoun Wharf')) {
    return new LambdaHttpResponse(500, 'Failed to find Seatoun Wharf Poi from test tile.');
  }

  // Validate Landcover
  if (!propertyCheck(tile.layers['transportation'], 'name', 'Mt Victoria Tunnel')) {
    return new LambdaHttpResponse(500, 'Failed to find grass Mt Victoria Tunnel from test tile.');
  }
  return;
}

function validateSouthIslandTile(tile: VectorTile): LambdaHttpResponse | undefined {
  // Validate landuse
  if (!propertyCheck(tile.layers['landuse'], 'name', 'Queenstown')) {
    return new LambdaHttpResponse(500, 'Failed to find Wellington Airport from test tile.');
  }
  // Validate Place Label
  if (!propertyCheck(tile.layers['place'], 'name', 'Christchurch')) {
    return new LambdaHttpResponse(500, 'Failed to find Christchurch label from test tile.');
  }

  // Validate Water
  if (!propertyCheck(tile.layers['water'], 'name', 'Tasman Lake')) {
    return new LambdaHttpResponse(500, 'Failed to find Tasman Lake from test tile.');
  }

  // Validate Coastline Exists
  if (!propertyCheck(tile.layers['coastline'], 'class', 'coastline')) {
    return new LambdaHttpResponse(500, 'Failed to find Coastline from test tile.');
  }

  // Validate LandCover
  if (!propertyCheck(tile.layers['landcover'], 'class', 'wood')) {
    return new LambdaHttpResponse(500, 'Failed to find grass landcover from test tile.');
  }

  // Validate Transportation
  if (!propertyCheck(tile.layers['transportation'], 'name', 'STATE HIGHWAY 6')) {
    return new LambdaHttpResponse(500, 'Failed to find grass STATE HIGHWAY 6 from test tile.');
  }
  return;
}

async function validateVectorTile(
  tileSet: ConfigTileSetVector,
  test: TestTile,
  req: LambdaHttpRequest,
): Promise<LambdaHttpResponse | undefined> {
  // Get the parse response tile to raw buffer
  const response = await tileXyzVector.tile(req, tileSet, test);
  if (response.status !== 200) return new LambdaHttpResponse(500, response.statusDescription);
  if (!Buffer.isBuffer(response._body)) throw new LambdaHttpResponse(500, 'Not a Buffer response content.');
  const buffer = isGzip(response._body) ? gunzipSync(response._body) : response._body;
  const tile = new VectorTile(new Protobuf(buffer));
  if (test.location === 'Wellington') return validateWellingtonTile(tile);
  if (test.location === 'South Island') return validateSouthIslandTile(tile);
  return;
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
      const response = await validateRasterTile(tileSet, test, req);
      if (response) return response;
    } else if (tileSet.type === TileSetType.Vector) {
      const response = await validateVectorTile(tileSet, test, req);
      if (response) return response;
    } else {
      throw new LambdaHttpResponse(500, `Invalid TileSet type for tileSet ${test.tileSet}`);
    }
  }

  // Return Ok response when all health test passed.
  const OkResponse = new LambdaHttpResponse(200, 'ok');
  OkResponse.header(HttpHeader.CacheControl, 'no-store');
  return OkResponse;
}
