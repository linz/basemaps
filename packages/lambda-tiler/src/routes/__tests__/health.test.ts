import assert from 'node:assert';
import { afterEach, before, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { LogConfig } from '@basemaps/shared';
import { LambdaAlbRequest, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { ALBEventRequestContext, Context } from 'aws-lambda';
import Protobuf from 'pbf';
import sinon from 'sinon';

import { FakeData } from '../../__tests__/config.data.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { getTestBuffer, healthGet, TestFeature, TestTiles } from '../health.js';
import { TileXyzRaster } from '../tile.xyz.raster.js';
import { tileXyzVector } from '../tile.xyz.vector.js';

const ctx: LambdaHttpRequest = new LambdaAlbRequest(
  {
    requestContext: null as unknown as ALBEventRequestContext,
    httpMethod: 'get',
    path: '/v1/tiles/health',
    body: null,
    isBase64Encoded: false,
  },
  {} as Context,
  LogConfig.get(),
);

// Write a test layer to the PBF
function writeLayer(testFeature: TestFeature, pbf: Protobuf): void {
  // Write the layer name
  pbf.writeStringField(1, testFeature.layer);

  const tags = [0, 0];
  // Write feature with tags
  pbf.writeMessage(
    2,
    (tags, pbf) => {
      writeFeature(tags, pbf);
    },
    tags,
  );

  // Write _keys
  pbf.writeStringField(3, testFeature.key);

  // Write _values
  pbf.writeMessage(
    4,
    (testFeature, pbf) => {
      pbf.writeStringField(1, testFeature.value);
    },
    testFeature,
  );
}

// Write a test feature to the PBF
function writeFeature(tags: number[], pbf: Protobuf): void {
  // Write Test Feature
  pbf.writeVarintField(1, 0);
  pbf.writePackedVarint(2, tags);
}

/**
 * Function to create a vector tile with specific properties
 *
 * https://github.com/mapbox/pbf/blob/main/test/fixtures/vector_tile.js
 */
function createTestTile(testFeatures: TestFeature[]): Buffer {
  const pbf = new Protobuf();

  // Iterate through each test feature
  for (const testFeature of testFeatures) {
    // Write the layer into the PBF
    pbf.writeMessage(3, writeLayer, testFeature);
  }

  return Buffer.from(pbf.finish());
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

  it('Should return bad response', () => {
    // Given ... a bad get tile response
    const BadResponse = new LambdaHttpResponse(500, 'Can not get Tile Set.');
    sandbox.stub(TileXyzRaster, 'tile').resolves(BadResponse);
    sandbox.stub(tileXyzVector, 'tile').resolves(BadResponse);

    // When ...Then ...
    assert.rejects(() => healthGet(ctx), BadResponse);
  });

  const Response1 = new LambdaHttpResponse(200, 'ok');
  const Response2 = new LambdaHttpResponse(200, 'ok');
  const Response3 = new LambdaHttpResponse(200, 'ok');
  const Response4 = new LambdaHttpResponse(200, 'ok');

  before(async () => {
    const testTileFile1 = await getTestBuffer(TestTiles[0]);
    Response1.buffer(testTileFile1);
    const testTileFile2 = await getTestBuffer(TestTiles[1]);
    Response2.buffer(testTileFile2);
    const testTileFile3 = createTestTile(TestTiles[2].testFeatures!);
    Response3.buffer(testTileFile3);
    const testTileFile4 = createTestTile(TestTiles[3].testFeatures!);
    Response4.buffer(testTileFile4);
  });
  // Prepare mock test tile response based on the static test tiles

  it('Should give a 200 response', async () => {
    // Given ... a series good get tile response
    const callbackRaster = sandbox.stub(TileXyzRaster, 'tile');
    const callbackVector = sandbox.stub(tileXyzVector, 'tile');
    callbackRaster.onCall(0).resolves(Response1);
    callbackRaster.onCall(1).resolves(Response2);
    callbackVector.onCall(0).resolves(Response3);
    callbackVector.onCall(1).resolves(Response4);

    // When ...
    const res = await healthGet(ctx);

    // Then ...
    assert.equal(res.status, 200);
    assert.equal(res.statusDescription, 'ok');
  });

  it('Should return mis-match tile response', () => {
    // Given ... a bad get tile response for second get tile
    const callback = sandbox.stub(TileXyzRaster, 'tile');
    callback.onCall(0).resolves(Response2);

    // When ... Then ...
    const BadResponse = new LambdaHttpResponse(500, 'TileSet does not match.');
    assert.rejects(() => healthGet(ctx), BadResponse);
  });
});
