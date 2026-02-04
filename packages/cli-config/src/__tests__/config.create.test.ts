import { before, describe, it } from 'node:test';

import { ensureBase58 } from '@basemaps/config';
import { fsa, FsMemory, LogConfig } from '@basemaps/shared';
import { TestTiff } from '@basemaps/test';
import assert from 'assert';
import { pathToFileURL } from 'url';

import { CreateConfigCommand } from '../cli/action.create.config.js';

describe('action.config.create', () => {
  const fsMem = new FsMemory();

  const baseArgs = {
    concurrency: 1,
    verbose: false,
    extraVerbose: false,

    target: new URL('target://imagery/'),
    host: new URL('https://basemaps.linz.govt.nz'),
    path: new URL('source://imagery/westland_2024_0.075m/'),

    output: pathToFileURL('/tmp/cogify/'),
  };

  before(() => {
    fsa.register('source://', fsMem);
    fsa.register('target://', fsMem);
    fsa.register('file:///tmp/', fsMem);

    LogConfig.get().level = 'silent';
  });

  it('should create a config with float32 elevation', async () => {
    await fsMem.write(new URL('source://imagery/westland_2024_0.075m/cog1.tif'), fsa.readStream(TestTiff.Float32Dem));
    await CreateConfigCommand.handler(baseArgs);

    const configPath = String(await fsMem.read(new URL('file:///tmp/cogify/config-path')));
    assert.ok(configPath.startsWith('target://imagery/basemaps-config-'));

    const configUrl = new URL(await fsMem.read(new URL('file:///tmp/cogify/config-url')));
    assert.equal(configUrl.searchParams.get('pipeline'), 'color-ramp');
    assert.equal(configUrl.searchParams.get('config'), ensureBase58(configPath));
    assert.equal(configUrl.searchParams.get('tileMatrix'), null); // web mercator quad is the default
    assert.equal(configUrl.searchParams.get('debug'), 'true');
    assert.equal(configUrl.searchParams.get('style'), 'westland-2024-0.075m');

    assert.equal(configUrl.host, 'basemaps.linz.govt.nz');

    const configUrlPreview = new URL(await fsMem.read(new URL('file:///tmp/cogify/config-url-preview')));
    assert.equal(configUrlPreview.searchParams.get('pipeline'), 'color-ramp');
    assert.equal(configUrlPreview.searchParams.get('config'), ensureBase58(configPath));
    assert.equal(configUrlPreview.host, 'basemaps.linz.govt.nz');

    assert.ok(configUrlPreview.pathname.startsWith('/v1/preview/westland-2024-0.075m/'));
  });

  it('should create a config with rgbi', async () => {
    await fsMem.write(new URL('source://imagery/westland_2024_0.075m/cog1.tif'), fsa.readStream(TestTiff.Rgbi16));
    await CreateConfigCommand.handler(baseArgs);

    const configPath = String(await fsMem.read(new URL('file:///tmp/cogify/config-path')));
    assert.ok(configPath.startsWith('target://imagery/basemaps-config-'));

    const configUrl = new URL(await fsMem.read(new URL('file:///tmp/cogify/config-url')));
    assert.equal(configUrl.searchParams.get('pipeline'), 'rgb');
    assert.equal(configUrl.searchParams.get('config'), ensureBase58(configPath));
    assert.equal(configUrl.searchParams.get('tileMatrix'), null); // web mercator quad is the default
    assert.equal(configUrl.searchParams.get('debug'), 'true');
    assert.equal(configUrl.searchParams.get('style'), 'westland-2024-0.075m');

    assert.equal(configUrl.host, 'basemaps.linz.govt.nz');

    const configUrlPreview = new URL(await fsMem.read(new URL('file:///tmp/cogify/config-url-preview')));
    assert.equal(configUrlPreview.searchParams.get('pipeline'), 'rgb');
    assert.equal(configUrlPreview.searchParams.get('config'), ensureBase58(configPath));
    assert.equal(configUrlPreview.host, 'basemaps.linz.govt.nz');

    assert.ok(configUrlPreview.pathname.startsWith('/v1/preview/westland-2024-0.075m/'));
  });

  it('should create a include tile matrix with NZTM2000Quad', async () => {
    await fsMem.write(new URL('source://imagery/westland_2024_0.075m/cog1.tif'), fsa.readStream(TestTiff.Nztm2000));
    await CreateConfigCommand.handler(baseArgs);

    const configPath = String(await fsMem.read(new URL('file:///tmp/cogify/config-path')));
    assert.ok(configPath.startsWith('target://imagery/basemaps-config-'));

    const configUrl = new URL(await fsMem.read(new URL('file:///tmp/cogify/config-url')));
    assert.equal(configUrl.searchParams.get('config'), ensureBase58(configPath));
    assert.equal(configUrl.searchParams.get('tileMatrix'), 'NZTM2000Quad');
    assert.equal(configUrl.searchParams.get('debug'), 'true');
    assert.equal(configUrl.searchParams.get('style'), 'westland-2024-0.075m');

    assert.equal(configUrl.host, 'basemaps.linz.govt.nz');

    const configUrlPreview = new URL(await fsMem.read(new URL('file:///tmp/cogify/config-url-preview')));
    assert.equal(configUrlPreview.searchParams.get('config'), ensureBase58(configPath));
    assert.equal(configUrlPreview.host, 'basemaps.linz.govt.nz');

    assert.ok(configUrlPreview.pathname.startsWith('/v1/preview/westland-2024-0.075m/'));
  });
});
