import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { base58, BaseConfig, ConfigProviderMemory } from '@basemaps/config';
import { setDefaultConfig } from '@basemaps/shared';
import { fsa, FsMemory } from '@chunkd/fs';

import { Api, mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { CachedConfig } from '../../util/config.cache.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { CoSources } from '../../util/source.cache.js';
import { fontList } from '../fonts.js';

describe('/v1/fonts', () => {
  const memory = new FsMemory();
  const config = new ConfigProviderMemory();

  beforeEach(() => {
    config.objects.clear();
    fsa.register('memory://', memory);
    config.assets = 'memory://assets/';
    setDefaultConfig(config);
  });

  afterEach(() => {
    CachedConfig.cache.clear();
    CoSources.cache.clear();
    memory.files.clear();
  });

  it('should return 404 if no font found', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => config);
    const res = await fontList(mockRequest('/v1/fonts.json'));
    assert.equal(res.status, 404);
  });

  it('should return a list of fonts found', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => config);

    await fsa.write(
      new URL('memory://assets/fonts/fonts.json'),
      Buffer.from(JSON.stringify(['Roboto Black', 'Roboto Thin'])),
    );
    const res = await fontList(mockRequest('/v1/fonts.json'));
    assert.equal(res.status, 200);
    assert.equal(res.header('content-type'), 'application/json');
    assert.equal(res.header('content-encoding'), undefined);
    assert.equal(res._body?.toString(), JSON.stringify(['Roboto Black', 'Roboto Thin']));
  });

  it('should get the correct font', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => config);

    await fsa.write(new URL('memory://assets/fonts/Roboto Thin/0-255.pbf'), Buffer.from(''));
    const res255 = await handler.router.handle(mockRequest('/v1/fonts/Roboto Thin/0-255.pbf'));
    assert.equal(res255.status, 200);
    assert.equal(res255.header('content-type'), 'application/x-protobuf');
    assert.equal(res255.header('content-encoding'), undefined);
    assert.notEqual(res255.header('etag'), undefined);
    assert.equal(res255.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');

    const res404 = await handler.router.handle(mockRequest('/v1/fonts/Roboto Thin/256-512.pbf'));
    assert.equal(res404.status, 404);
  });

  it('should get the correct utf8 font', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => config);

    await fsa.write(new URL('memory://assets/fonts/🦄 🌈/0-255.pbf'), Buffer.from(''));
    const res255 = await handler.router.handle(mockRequest('/v1/fonts/🦄 🌈/0-255.pbf'));
    assert.equal(res255.status, 200);
    assert.equal(res255.header('content-type'), 'application/x-protobuf');
    assert.equal(res255.header('content-encoding'), undefined);
    assert.notEqual(res255.header('etag'), undefined);
    assert.equal(res255.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');
  });

  it('should return 404 if no asset location set', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => config);

    config.assets = undefined;
    const res = await fontList(mockRequest('/v1/fonts.json'));
    assert.equal(res.status, 404);
  });

  it('should get the correct utf8 font with default assets', async () => {
    config.assets = undefined;
    const configJson = config.toJson();
    await fsa.write(new URL(`memory://config-${configJson.hash}.json`), JSON.stringify(configJson));

    config.objects.set('cb_latest', {
      id: 'cb_latest',
      name: 'latest',
      path: `memory://config-${configJson.hash}.json`,
      hash: configJson.hash,
      assets: 'memory://new-location/',
    } as BaseConfig);

    await fsa.write(new URL('memory://new-location/fonts/Roboto Thin/0-255.pbf'), Buffer.from(''));
    const res255 = await handler.router.handle(mockRequest('/v1/fonts/Roboto Thin/0-255.pbf'));
    assert.equal(res255.status, 200, res255.statusDescription);
    assert.equal(res255.header('content-type'), 'application/x-protobuf');
    assert.equal(res255.header('content-encoding'), undefined);
    assert.notEqual(res255.header('etag'), undefined);
    assert.equal(res255.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');
  });

  it('should get the correct utf8 font with config assets', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => config);

    const cfgBundle = new ConfigProviderMemory();
    cfgBundle.assets = 'memory://config/assets/';
    await fsa.write(new URL('memory://linz-basemaps/bar.json'), JSON.stringify(cfgBundle.toJson()));
    await fsa.write(new URL('memory://config/assets/fonts/🦄 🌈/0-255.pbf'), Buffer.from(''));

    const configLocation = base58.encode(Buffer.from('memory://linz-basemaps/bar.json'));
    const res255 = await handler.router.handle(
      mockUrlRequest('/v1/fonts/🦄 🌈/0-255.pbf', `?config=${configLocation}`, Api.header),
    );
    assert.equal(res255.status, 200);
    assert.equal(res255.header('content-type'), 'application/x-protobuf');
    assert.equal(res255.header('content-encoding'), undefined);
    assert.notEqual(res255.header('etag'), undefined);
    assert.equal(res255.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');
  });
});
