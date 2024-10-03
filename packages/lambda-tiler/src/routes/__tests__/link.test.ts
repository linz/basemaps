import { strictEqual } from 'node:assert';
import { afterEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';

import { FakeData, Imagery3857 } from '../../__tests__/config.data.js';
import { mockRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';

describe('/v1/link/:tileSet', () => {
  const FakeTileSetName = 'tileset';
  const config = new ConfigProviderMemory();

  afterEach(() => {
    config.objects.clear();
  });

  /**
   * 3xx status responses
   */

  // tileset found, is raster type, has one layer, has '3857' entry, imagery found > 302 response
  it('success: redirect to pre-zoomed imagery', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    config.put(FakeData.tileSetRaster(FakeTileSetName));
    config.put(Imagery3857);

    const req = mockRequest(`/v1/link/${FakeTileSetName}`);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 302);
    strictEqual(res.statusDescription, 'Redirect to pre-zoomed imagery');
  });

  /**
   * 4xx status responses
   */

  // tileset not found > 404 response
  it('failure: tileset not found', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    const req = mockRequest(`/v1/link/${FakeTileSetName}`);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 404);
    strictEqual(res.statusDescription, 'Tileset not found');
  });

  // tileset found, not raster type > 400 response
  it('failure: tileset must be raster type', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    config.put(FakeData.tileSetVector(FakeTileSetName));

    const req = mockRequest(`/v1/link/${FakeTileSetName}`);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 400);
    strictEqual(res.statusDescription, 'Tileset must be raster type');
  });

  // tileset found, is raster type, has more than one layer > 400 response
  it('failure: too many layers', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    const tileSet = FakeData.tileSetRaster(FakeTileSetName);

    // add another layer
    tileSet.layers.push(tileSet.layers[0]);

    config.put(tileSet);

    const req = mockRequest(`/v1/link/${FakeTileSetName}`);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 400);
    strictEqual(res.statusDescription, 'Too many layers');
  });

  // tileset found, is raster type, has one layer, no '3857' entry > 400 response
  it("failure: no imagery for '3857' projection", async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    const tileSet = FakeData.tileSetRaster(FakeTileSetName);

    // delete '3857' entry
    delete tileSet.layers[0][Epsg.Google.code];

    config.put(tileSet);

    const req = mockRequest(`/v1/link/${FakeTileSetName}`);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 400);
    strictEqual(res.statusDescription, "No imagery for '3857' projection");
  });

  // tileset found, is raster type, has one layer, has '3857' entry, imagery not found > 400 response
  it('failure: imagery not found', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    config.put(FakeData.tileSetRaster(FakeTileSetName));

    const req = mockRequest(`/v1/link/${FakeTileSetName}`);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 400);
    strictEqual(res.statusDescription, 'Imagery not found');
  });
});
