import { ConfigTileSetVector } from '@basemaps/config';
import { GoogleTms } from '@basemaps/geo';
import { Env, LogConfig } from '@basemaps/shared';
import { LambdaAlbRequest, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import o from 'ospec';
import sinon from 'sinon';
import { TileSets } from '../../tile.set.cache.js';
import { TileSet } from '../../tile.set.js';
import { TileSetRaster } from '../../tile.set.raster.js';
import { TileSetVector } from '../../tile.set.vector.js';
import { getTestBuffer, Health, healthRaster, healthVector, TestRasterTiles } from '../health.js';

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

  const tileSet = new TileSetRaster('health-raster', GoogleTms);
  const tileSetVector = new TileSetVector('health-vector', GoogleTms);
  const Response1 = new LambdaHttpResponse(200, 'ok');
  const Response2 = new LambdaHttpResponse(200, 'ok');
  o.before(async () => {
    const testTileFile1 = await getTestBuffer(TestRasterTiles[0]);
    Response1.buffer(testTileFile1);
    const testTileFile2 = await getTestBuffer(TestRasterTiles[1]);
    Response2.buffer(testTileFile2);
  });

  const startingUrlBase = process.env[Env.PublicUrlBase];
  o.beforeEach(() => {
    // Ensure no public URL base is set
    delete process.env[Env.PublicUrlBase];
    tileSetVector.init({ maxZoom: 15 } as ConfigTileSetVector);
    tileSet.init({ layers: [] } as any);
    sandbox.stub(TileSets, 'get').callsFake(async (name): Promise<TileSet> => {
      if (name === tileSet.fullName) return tileSet;
      if (name === tileSetVector.fullName) return tileSetVector;
      throw new Error('Invalid tile set: ' + name);
    });
  });

  o.afterEach(() => {
    process.env[Env.PublicUrlBase] = startingUrlBase;
    sandbox.restore();
  });

  o('should run health', async () => {
    const callback = sandbox.stub(tileSet, 'tile');
    callback.onCall(0).resolves(Response1);
    callback.onCall(1).resolves(Response2);

    const res = await Health(ctx);

    o(res.status).equals(200);
  });

  o.spec('healthVector', () => {
    o('should validate with health-vector', async () => {
      const res = await healthVector(ctx);
      o(res).equals(undefined);
    });

    o('should validate tile json', async () => {
      delete tileSetVector.tileSet.maxZoom;

      const res = await healthVector(ctx);

      o(res?.status).equals(500);
      o(res?.statusDescription).equals('Vector.TileJSON: missing max zoom');
    });
  });

  o.spec('healthRaster', () => {
    o('Should return bad response', async () => {
      // Given ... a bad get tile response
      const BadResponse = new LambdaHttpResponse(500, 'Can not get Tile Set.');
      sandbox.stub(tileSet, 'tile').resolves(BadResponse);

      // When ...
      const res = await healthRaster(ctx);

      // Then ...
      o(res?.status).equals(500);
      o(res?.statusDescription).equals('Can not get Tile Set.');
    });

    // Prepare mock test tile response based on the static test tiles

    o('Should give a 200 response', async () => {
      // Given ... a series good get tile response
      const callback = sandbox.stub(tileSet, 'tile');
      callback.onCall(0).resolves(Response1);
      callback.onCall(1).resolves(Response2);

      // When ...
      const res = await healthRaster(ctx);

      // Then ...
      o(res).equals(undefined);
    });

    o('Should return mis-match tile response', async () => {
      // Given ... a bad get tile response for second get tile
      const callback = sandbox.stub(tileSet, 'tile');
      callback.onCall(0).resolves(Response1);
      callback.onCall(1).resolves(Response1);

      // When ...
      const res = await healthRaster(ctx);

      // Then ...
      o(res?.status).equals(500);
      o(res?.statusDescription).equals('Raster: Tile "tile_NZTM2000Quad_30_33_z6.png" does not match.');
    });

    o('should error if invalid tilejson', async () => {
      const callback = sandbox.stub(tileSet, 'tile');
      callback.onCall(0).resolves(Response1);
      callback.onCall(1).resolves(Response2);

      tileSet.tileSet.format = 'fake' as any;
      const res = await healthRaster(ctx);
      o(res?.status).equals(500);
      o(res?.statusDescription.startsWith('Raster.TileJSON: invalid tileUrl /v1/tiles')).equals(true);
    });
  });
});
