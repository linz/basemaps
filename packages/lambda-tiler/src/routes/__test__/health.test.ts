import { GoogleTms } from '@basemaps/geo';
import { LogConfig } from '@basemaps/shared';
import { LambdaAlbRequest, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import o from 'ospec';
import sinon from 'sinon';
import { TileSets } from '../../tile.set.cache.js';
import { TileSetRaster } from '../../tile.set.raster.js';
import { getTestBuffer, Health, TestTiles } from '../health.js';

const ctx: LambdaHttpRequest = new LambdaAlbRequest(
  {
    requestContext: null as any,
    httpMethod: 'get',
    path: '/v1/tiles/health',
    body: null,
    isBase64Encoded: false,
  },
  {} as Context,
  LogConfig.get(),
);

o.spec('health', async () => {
  o.specTimeout(1000);
  const sandbox = sinon.createSandbox();

  const tileSet = new TileSetRaster('health', GoogleTms);
  o.beforeEach(() => {
    sandbox.stub(TileSets, 'get').resolves(tileSet);
  });

  o.afterEach(() => {
    sandbox.restore();
  });

  o('Should return bad response', async () => {
    // Given ... a bad get tile response
    const BadResponse = new LambdaHttpResponse(500, 'Can not get Tile Set.');
    sandbox.stub(tileSet, 'tile').resolves(BadResponse);

    // When ...
    const res = await Health(ctx);

    // Then ...
    o(res.status).equals(500);
    o(res.statusDescription).equals('Can not get Tile Set.');
  });

  const Response1 = new LambdaHttpResponse(200, 'ok');
  const Response2 = new LambdaHttpResponse(200, 'ok');

  o.before(async () => {
    const testTileFile1 = await getTestBuffer(TestTiles[0]);
    Response1.buffer(testTileFile1);
    const testTileFile2 = await getTestBuffer(TestTiles[1]);
    Response2.buffer(testTileFile2);
  });
  // Prepare mock test tile response based on the static test tiles

  o('Should give a 200 response', async () => {
    // Given ... a series good get tile response
    const callback = sandbox.stub(tileSet, 'tile');
    callback.onCall(0).resolves(Response1);
    callback.onCall(1).resolves(Response2);

    // When ...
    const res = await Health(ctx);

    // Then ...
    o(res.status).equals(200);
    o(res.statusDescription).equals('ok');
  });

  o('Should return mis-match tile response', async () => {
    // Given ... a bad get tile response for second get tile
    const callback = sandbox.stub(tileSet, 'tile');
    callback.onCall(0).resolves(Response1);
    callback.onCall(1).resolves(Response1);

    // When ...
    const res = await Health(ctx);

    // Then ...
    o(res.status).equals(500);
    o(res.statusDescription).equals('TileSet does not match.');
  });
});
