import assert from 'node:assert';
import { afterEach, before, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { fsa } from '@chunkd/fs';
import { FsMemory } from '@chunkd/source-memory';
import { createSandbox } from 'sinon';
import { gunzipSync, gzipSync } from 'zlib';

import { mockRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';

describe('/v1/sprites', () => {
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
    memory.files.clear();
    sandbox.restore();
  });

  it('should fetch a json document', async () => {
    await Promise.all([
      fsa.write('memory://sprites/topographic.json', Buffer.from(JSON.stringify({ test: true }))),
      fsa.write('memory://sprites/topographic.png', Buffer.from('')),
    ]);
    const res = await handler.router.handle(mockRequest('/v1/sprites/topographic.json'));
    assert.equal(res.status, 200);
    assert.equal(res.header('content-type'), 'application/json');
    assert.equal(res.header('content-encoding'), undefined);
    assert.notEqual(res.header('etag'), undefined);
    assert.equal(res.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');

    assert.deepEqual(JSON.parse(Buffer.from(res.body, 'base64').toString()), { test: true });
  });

  it('should fetch a png', async () => {
    await Promise.all([
      fsa.write('memory://sprites/topographic.json', Buffer.from(JSON.stringify({ test: true }))),
      fsa.write('memory://sprites/topographic@2x.png', Buffer.from('')),
    ]);
    const res = await handler.router.handle(mockRequest('/v1/sprites/topographic@2x.png'));
    assert.equal(res.status, 200);
    assert.equal(res.header('content-type'), 'image/png');
    assert.notEqual(res.header('etag'), undefined);
    assert.equal(res.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');
  });

  it('should detect gziped files and set content-encoding', async () => {
    await Promise.all([
      fsa.write('memory://sprites/topographic.json', gzipSync(Buffer.from(JSON.stringify({ test: true })))),
    ]);
    const res = await handler.router.handle(mockRequest('/v1/sprites/topographic.json'));
    assert.equal(res.status, 200);
    assert.equal(res.header('content-type'), 'application/json');
    assert.equal(res.header('content-encoding'), 'gzip');
    assert.notEqual(res.header('etag'), undefined);
    assert.equal(res.header('cache-control'), 'public, max-age=604800, stale-while-revalidate=86400');
    assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(res.body, 'base64')).toString()), { test: true });
  });
});
