import { afterEach, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { fsa, FsMemory, LogConfig, s3Config } from '@basemaps/shared';
import assert from 'assert';

import { FakeData } from '../../__tests__/config.data.js';
import { Api, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';

describe('tileset.export', () => {
  const config = new ConfigProviderMemory();

  beforeEach(() => {
    LogConfig.get().level = 'silent';
    fsa.register('s3://fake-memory/', new FsMemory());
  });

  afterEach(() => {
    config.objects.clear();
  });

  it('should create presigned url', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    t.mock.method(s3Config, 'getSignedUrl', () => Promise.resolve('https://fake-s3-url.com/tileset.mbtiles'));

    const topographic = FakeData.tileSetVector('topographic');
    topographic.layers[0][2193] = 's3://fake-memory/fake-tiles.tar.co';
    config.put(topographic);

    await fsa.write(fsa.toUrl('s3://fake-memory/fake-tiles.mbtiles'), Buffer.from('ABC123'));

    const res = await handler.router.handle(
      mockUrlRequest('/v1/export/topographic/NZTM2000Quad.mbtiles', 'get', Api.header),
    );
    assert.equal(res.status, 302); // Temporary redirect
    assert.equal(res.headers.get('location'), 'https://fake-s3-url.com/tileset.mbtiles');
  });

  it('should fail if mbtiles do not exist', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));
    t.mock.method(s3Config, 'getSignedUrl', () => Promise.resolve('https://fake-s3-url.com/tileset.mbtiles'));

    const topographic = FakeData.tileSetVector('topographic');
    topographic.layers[0][2193] = 's3://fake-memory/fake-tiles.tar.co';
    config.put(topographic);

    const res = await handler.router.handle(
      mockUrlRequest('/v1/export/topographic/NZTM2000Quad.mbtiles', 'get', Api.header),
    );
    assert.equal(res.status, 404);
  });
});
