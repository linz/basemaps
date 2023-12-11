import assert from 'node:assert';
import { afterEach, before, beforeEach, describe, it } from 'node:test';

import { base58, ConfigProviderMemory } from '@basemaps/config';
import { getDefaultConfig } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { FsMemory } from '@chunkd/source-memory';
import { createSandbox } from 'sinon';

import { Api, mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { CachedConfig } from '../../util/config.cache.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { CoSources } from '../../util/source.cache.js';
import { fontList } from '../fonts.js';

describe('/v1/fonts', () => {
  const memory = new FsMemory();
  const sandbox = createSandbox();
  const config = new ConfigProviderMemory();

  before(() => {
    fsa.register('memory://', memory);
  });

  beforeEach(() => {
    config.assets = 'memory://';
    sandbox.stub(ConfigLoader, 'getDefaultConfig').resolves(config);
  });

  afterEach(() => {
    sandbox.restore();
    CachedConfig.cache.clear();
    CoSources.cache.clear();
    memory.files.clear();
  });

  it('should return 404 if no font found', async () => {
    const res = await fontList(mockRequest('/v1/fonts.json'));
    assert.equal(res.status, 404);
  });

  it('should return a list of fonts found', async () => {
    await fsa.write('memory://fonts/fonts.json', Buffer.from(JSON.stringify(['Roboto Black', 'Roboto Thin'])));
    const res = await fontList(mockRequest('/v1/fonts.json'));
    assert.equal(res.status, 200);
    assert.equal(res.header('content-type'), 'application/json');
    assert.equal(res.header('content-encoding'), undefined);
    assert.equal(res._body?.toString(), JSON.stringify(['Roboto Black', 'Roboto Thin']));
  });

  it('should get the correct font', async () => {
    await fsa.write('memory://fonts/Roboto Thin/0-255.pbf', Buffer.from(''));
    const res255 = await handler.router.handle(mockRequest('/v1/fonts/Roboto Thin/0-255.pbf'));
    assert.equal(res255.status, 200);
    assert.equal(res255.header('content-type'), 'application/x-protobuf');
    assert.equal(res255.header('content-encoding'), undefined);
    assert.notEqual(res255.header('etag'), undefined);
    assert.equal(res255.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');

    const res404 = await handler.router.handle(mockRequest('/v1/fonts/Roboto Thin/256-512.pbf'));
    assert.equal(res404.status, 404);
  });

  it('should get the correct utf8 font', async () => {
    await fsa.write('memory://fonts/🦄 🌈/0-255.pbf', Buffer.from(''));
    const res255 = await handler.router.handle(mockRequest('/v1/fonts/🦄 🌈/0-255.pbf'));
    assert.equal(res255.status, 200);
    assert.equal(res255.header('content-type'), 'application/x-protobuf');
    assert.equal(res255.header('content-encoding'), undefined);
    assert.notEqual(res255.header('etag'), undefined);
    assert.equal(res255.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');
  });

  it('should return 404 if no asset location set', async () => {
    getDefaultConfig().assets = undefined;
    const res = await fontList(mockRequest('/v1/fonts.json'));
    assert.equal(res.status, 404);
  });

  it('should get the correct utf8 font with default assets', async () => {
    getDefaultConfig().assets = undefined;
    sandbox
      .stub(config.ConfigBundle, 'get')
      .resolves({ id: 'cb_latest', name: 'latest', path: 'latest', hash: 'hash', assets: 'memory://' });
    await fsa.write('memory://fonts/Roboto Thin/0-255.pbf', Buffer.from(''));
    const res255 = await handler.router.handle(mockRequest('/v1/fonts/Roboto Thin/0-255.pbf'));
    assert.equal(res255.status, 200);
    assert.equal(res255.header('content-type'), 'application/x-protobuf');
    assert.equal(res255.header('content-encoding'), undefined);
    assert.notEqual(res255.header('etag'), undefined);
    assert.equal(res255.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');
  });

  it('should get the correct utf8 font with config assets', async () => {
    const cfgBundle = new ConfigProviderMemory();
    cfgBundle.assets = 'memory://config/assets';
    await fsa.write('memory://linz-basemaps/bar.json', JSON.stringify(cfgBundle.toJson()));
    await fsa.write('memory://config/assets/fonts/🦄 🌈/0-255.pbf', Buffer.from(''));

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
