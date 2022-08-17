import { ConfigProviderMemory } from '@basemaps/config';
import { LogConfig } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding.js';
import o from 'ospec';
import sinon from 'sinon';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { Etag } from '../../util/etag.js';
import { FakeData } from '../../__tests__/config.data.js';
import { Api, mockRequest } from '../../__tests__/xyz.util.js';

const sandbox = sinon.createSandbox();

const TileSetNames = ['aerial', 'aerial:ōtorohanga_urban_2021_0-1m_RGB', '01FYWKAJ86W9P7RWM1VB62KD0H'];
o.spec('/v1/tiles', () => {
  const config = new ConfigProviderMemory();

  o.beforeEach(() => {
    LogConfig.get().level = 'silent';
    sandbox.stub(ConfigLoader, 'load').resolves(config);
    config.objects.clear();

    for (const tileSetName of TileSetNames) config.put(FakeData.tileSetRaster(tileSetName));

    sandbox.stub(Etag, 'key').returns('fakeEtag');
  });

  o.afterEach(() => {
    config.objects.clear();
    sandbox.restore();
  });

  o('should export handler', async () => {
    const base = await import('../../index.js');
    o(typeof base.handler).equals('function');
  });

  TileSetNames.forEach((tileSetName) => {
    o(`should generate a tile/v1/tiles/${tileSetName}/global-mercator/0/0/0.png`, async () => {
      const request = mockRequest(`/v1/tiles/${tileSetName}/global-mercator/0/0/0.png`, 'get', Api.header);
      const res = await handler.router.handle(request);
      o(res.status).equals(200);
      o(res.header('content-type')).equals('image/png');
      o(res.header('eTaG')).equals('fakeEtag');

      // Validate the session information has been set correctly
      o(request.logContext['tileSet']).equals(tileSetName);
      o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
      o(round(request.logContext['location'])).deepEquals({ lat: 0, lon: 0 });
    });
  });

  o('should generate a tile 0,0,0 for webp', async () => {
    const request = mockRequest('/v1/tiles/aerial/3857/0/0/0.webp', 'get', Api.header);
    const res = await handler.router.handle(request);
    o(res.status).equals(200);
    o(res.header('content-type')).equals('image/webp');
    o(res.header('eTaG')).equals('fakeEtag');
    // o(res.body).equals(rasterMockBuffer.toString('base64'));

    // Validate the session information has been set correctly
    o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
    o(round(request.logContext['location'])).deepEquals({ lat: 0, lon: 0 });
  });

  ['png', 'webp', 'jpeg', 'avif'].forEach((fmt) => {
    o(`should 200 with empty ${fmt} if a tile is out of bounds`, async () => {
      o.timeout(1_000);

      const res = await handler.router.handle(
        mockRequest(`/v1/tiles/aerial/global-mercator/0/0/0.${fmt}`, 'get', Api.header),
      );
      o(res.status).equals(200);
      o(res.header('content-type')).equals(`image/${fmt}`);
      o(res.header('etag')).notEquals(undefined);
      o(res.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');
    });
  });

  o('should 304 if a tile is not modified', async () => {
    const key = 'fakeEtag';
    const request = mockRequest('/v1/tiles/aerial/global-mercator/0/0/0.png', 'get', {
      'if-none-match': key,
      ...Api.header,
    });
    const res = await handler.router.handle(request);
    o(res.status).equals(304);
    o(res.header('eTaG')).equals(undefined);

    o(request.logContext['cache']).deepEquals({ match: key, hit: true });
  });

  o('should 404 if a tile is outside of the range', async () => {
    const res = await handler.router.handle(
      mockRequest('/v1/tiles/aerial/global-mercator/25/0/0.png', 'get', Api.header),
    );
    o(res.status).equals(404);

    const resB = await handler.router.handle(mockRequest('/v1/tiles/aerial/2193/17/0/0.png', 'get', Api.header));
    o(resB.status).equals(404);
  });

  o('should support utf8 tilesets', async () => {
    const fakeTileSet = FakeData.tileSetRaster('🦄 🌈');
    config.put(fakeTileSet);
    const req = mockRequest('/v1/tiles/🦄 🌈/global-mercator/0/0/0.png', 'get', Api.header);
    o(req.path).equals('/v1/tiles/%F0%9F%A6%84%20%F0%9F%8C%88/global-mercator/0/0/0.png');
    const res = await handler.router.handle(req);
    o(res.status).equals(200);
    o(res.header('content-type')).equals('image/png');
    o(res.header('etag')).notEquals(undefined);
    o(res.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');
  });

  ['/favicon.ico', '/index.html', '/foo/bar'].forEach((path) => {
    o('should 404 on invalid paths: ' + path, async () => {
      const res = await handler.router.handle(mockRequest(path, 'get', Api.header));
      o(res.status).equals(404);
    });
  });
});
