import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { LogConfig } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding.js';
import sinon from 'sinon';

import { FakeData } from '../../__tests__/config.data.js';
import { Api, mockRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { Etag } from '../../util/etag.js';

const sandbox = sinon.createSandbox();

const TileSetNames = ['aerial', 'aerial:ōtorohanga_urban_2021_0-1m_RGB', '01FYWKAJ86W9P7RWM1VB62KD0H'];
describe('/v1/tiles', () => {
  const config = new ConfigProviderMemory();

  beforeEach(() => {
    LogConfig.get().level = 'silent';
    sandbox.stub(ConfigLoader, 'getDefaultConfig').resolves(config);
    config.objects.clear();

    for (const tileSetName of TileSetNames) config.put(FakeData.tileSetRaster(tileSetName));

    config.put(FakeData.tileSetComputed('elevation'));

    sandbox.stub(Etag, 'key').returns('fakeEtag');
  });

  afterEach(() => {
    config.objects.clear();
    sandbox.restore();
  });

  // it('should export handler', async () => {
  //   const base = await import('../../index.js');
  //   assert.equal(typeof base.handler, 'function');
  // });

  // TileSetNames.forEach((tileSetName) => {
  //   it(`should generate a tile/v1/tiles/${tileSetName}/global-mercator/0/0/0.png`, async () => {
  //     const request = mockRequest(`/v1/tiles/${tileSetName}/global-mercator/0/0/0.png`, 'get', Api.header);
  //     const res = await handler.router.handle(request);
  //     assert.equal(res.status, 200);
  //     assert.equal(res.header('content-type'), 'image/png');
  //     assert.equal(res.header('eTaG'), 'fakeEtag');

  //     // Validate the session information has been set correctly
  //     assert.equal(request.logContext['tileSet'], tileSetName);
  //     assert.deepEqual(request.logContext['xyz'], { x: 0, y: 0, z: 0 });
  //     assert.deepEqual(round(request.logContext['location']), { lat: 0, lon: 0 });
  //   });
  // });

  // it('should generate a tile 0,0,0 for webp', async () => {
  //   const request = mockRequest('/v1/tiles/aerial/3857/0/0/0.webp', 'get', Api.header);
  //   const res = await handler.router.handle(request);
  //   assert.equal(res.status, 200);
  //   assert.equal(res.header('content-type'), 'image/webp');
  //   assert.equal(res.header('eTaG'), 'fakeEtag');
  //   // o(res.body).equals(rasterMockBuffer.toString('base64'));

  //   // Validate the session information has been set correctly
  //   assert.deepEqual(request.logContext['xyz'], { x: 0, y: 0, z: 0 });
  //   assert.deepEqual(round(request.logContext['location']), { lat: 0, lon: 0 });
  // });

  it('should compute a tile 0,0,0 for webp', async () => {
    const request = mockRequest('/v1/tiles/elevation/3857/0/0/0.terrain-rgb.webp', 'get', Api.header);
    const res = await handler.router.handle(request);
    assert.equal(res.status, 200, res.statusDescription);
    assert.equal(res.header('content-type'), 'image/webp');
    assert.equal(res.header('eTaG'), 'fakeEtag');
    // o(res.body).equals(rasterMockBuffer.toString('base64'));

    // Validate the session information has been set correctly
    assert.deepEqual(request.logContext['xyz'], { x: 0, y: 0, z: 0 });
    assert.deepEqual(round(request.logContext['location']), { lat: 0, lon: 0 });
  });

  // ['png', 'webp', 'jpeg', 'avif'].forEach((fmt) => {
  //   it(`should 200 with empty ${fmt} if a tile is out of bounds`, async () => {
  //     const res = await handler.router.handle(
  //       mockRequest(`/v1/tiles/aerial/global-mercator/0/0/0.${fmt}`, 'get', Api.header),
  //     );
  //     assert.equal(res.status, 200);
  //     assert.equal(res.header('content-type'), `image/${fmt}`);
  //     assert.notEqual(res.header('etag'), undefined);
  //     assert.equal(res.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');
  //   });
  // });

  // it('should 304 if a tile is not modified', async () => {
  //   const key = 'fakeEtag';
  //   const request = mockRequest('/v1/tiles/aerial/global-mercator/0/0/0.png', 'get', {
  //     'if-none-match': key,
  //     ...Api.header,
  //   });
  //   const res = await handler.router.handle(request);
  //   assert.equal(res.status, 304);
  //   assert.equal(res.header('eTaG'), undefined);

  //   assert.deepEqual(request.logContext['cache'], { match: key, hit: true });
  // });

  // it('should 404 if a tile is outside of the range', async () => {
  //   const res = await handler.router.handle(
  //     mockRequest('/v1/tiles/aerial/global-mercator/25/0/0.png', 'get', Api.header),
  //   );
  //   assert.equal(res.status, 404);

  //   const resB = await handler.router.handle(mockRequest('/v1/tiles/aerial/2193/17/0/0.png', 'get', Api.header));
  //   assert.equal(resB.status, 404);
  // });

  // it('should support utf8 tilesets', async () => {
  //   const fakeTileSet = FakeData.tileSetRaster('🦄 🌈');
  //   config.put(fakeTileSet);
  //   const req = mockRequest('/v1/tiles/🦄 🌈/global-mercator/0/0/0.png', 'get', Api.header);
  //   assert.equal(req.path, '/v1/tiles/%F0%9F%A6%84%20%F0%9F%8C%88/global-mercator/0/0/0.png');
  //   const res = await handler.router.handle(req);
  //   assert.equal(res.status, 200);
  //   assert.equal(res.header('content-type'), 'image/png');
  //   assert.notEqual(res.header('etag'), undefined);
  //   assert.equal(res.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');
  // });

  // ['/favicon.ico', '/index.html', '/foo/bar'].forEach((path) => {
  //   it('should 404 on invalid paths: ' + path, async () => {
  //     const res = await handler.router.handle(mockRequest(path, 'get', Api.header));
  //     assert.equal(res.status, 404);
  //   });
  // });
});
