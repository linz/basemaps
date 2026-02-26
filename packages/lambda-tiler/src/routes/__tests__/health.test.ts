import assert from 'node:assert';
import { afterEach, before, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { LambdaHttpResponse } from '@linzjs/lambda';
import { VectorTile, VectorTileFeature, VectorTileLayer } from '@mapbox/vector-tile';
import sinon from 'sinon';

import { FakeData } from '../../__tests__/config.data.js';
import { mockRequest } from '../../__tests__/xyz.util.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { getTestBuffer, healthGet, TestFeature, TestTiles, VectorTileProvider } from '../health.js';
import { TileXyzRaster } from '../tile.xyz.raster.js';
import { tileXyzVector } from '../tile.xyz.vector.js';

//  Function to create a vector tile with specific properties for testing
function createTestTile(testFeatures: TestFeature[]): VectorTile {
  const layers: Record<string, VectorTileLayer> = {};
  for (const testFeature of testFeatures) {
    const layer = {
      features: [{ properties: { [testFeature.key]: testFeature.value } }],

      feature(i: number): VectorTileFeature {
        return this.features[i] as VectorTileFeature;
      },

      get length(): number {
        return this.features.length;
      },
    };

    layers[testFeature.layer] = layer as unknown as VectorTileLayer;
  }
  return { layers } as unknown as VectorTile;
}

describe('/v1/health', () => {
  const sandbox = sinon.createSandbox();
  const config = new ConfigProviderMemory();

  const fakeTileSetRaster = FakeData.tileSetRaster('health');
  const fakeTileSetVector = FakeData.tileSetVector('topographic');
  beforeEach(() => {
    config.objects.clear();
    sandbox.stub(ConfigLoader, 'getDefaultConfig').resolves(config);
    config.put(fakeTileSetRaster);
    config.put(fakeTileSetVector);
  });

  afterEach(() => {
    config.objects.clear();
    sandbox.restore();
  });

  it('Should return bad response', async () => {
    // Given ... a bad get tile response
    const BadResponse = new LambdaHttpResponse(500, 'Can not get Tile Set.');
    sandbox.stub(TileXyzRaster, 'tile').resolves(BadResponse);
    sandbox.stub(tileXyzVector, 'tile').resolves(BadResponse);

    // When ...Then ...
    await assert.rejects(() => healthGet(mockRequest('/v1/tiles/health')), BadResponse);
  });

  const Response1 = new LambdaHttpResponse(200, 'ok');
  const Response2 = new LambdaHttpResponse(200, 'ok');

  before(async () => {
    const testTileFile1 = await getTestBuffer(TestTiles[0]);
    Response1.buffer(testTileFile1);
    const testTileFile2 = await getTestBuffer(TestTiles[1]);
    Response2.buffer(testTileFile2);
  });
  // Prepare mock test tile response based on the static test tiles

  it('Should give a 200 response', async () => {
    // Given ... a series good get tile response
    const callbackRaster = sandbox.stub(TileXyzRaster, 'tile');

    callbackRaster.onCall(0).resolves(Response1);
    callbackRaster.onCall(1).resolves(Response2);
    const callbackVectorTile = sandbox.stub(VectorTileProvider, 'getVectorTile');
    const testVectorTile1 = createTestTile(TestTiles[2].testFeatures!);
    const testVectorTile2 = createTestTile(TestTiles[3].testFeatures!);
    callbackVectorTile.onCall(0).resolves(testVectorTile1);
    callbackVectorTile.onCall(1).resolves(testVectorTile2);

    // When ...
    const res = await healthGet(mockRequest('/v1/tiles/health'));

    // Then ...
    assert.equal(res.status, 200);
    assert.equal(res.statusDescription, 'ok');
  });

  it('Should return mis-match tile response', async () => {
    // Given ... a bad get tile response for second get tile
    const callback = sandbox.stub(TileXyzRaster, 'tile');
    callback.onCall(0).resolves(Response2);

    // When ... Then ...
    const BadResponse = new LambdaHttpResponse(500, 'TileSet does not match.');
    await assert.rejects(() => healthGet(mockRequest('/v1/tiles/health')), BadResponse);
  });
});
