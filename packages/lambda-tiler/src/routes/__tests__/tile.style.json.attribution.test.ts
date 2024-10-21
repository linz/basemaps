import assert, { strictEqual } from 'node:assert';
import { afterEach, before, describe, it } from 'node:test';

import { copyright, createLicensorAttribution } from '@basemaps/attribution/build/utils/utils.js';
import { ConfigProviderMemory, StyleJson } from '@basemaps/config';
import { StacProvider } from '@basemaps/geo';
import { Env } from '@basemaps/shared';

import { FakeData, Imagery3857 } from '../../__tests__/config.data.js';
import { Api, mockRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';

const defaultAttribution = `${copyright} LINZ`;

describe('/v1/styles', () => {
  const host = 'https://tiles.test';
  const config = new ConfigProviderMemory();

  const FakeTileSetName = 'tileset';
  const FakeLicensor1: StacProvider = {
    name: 'L1',
    roles: ['licensor'],
  };
  const FakeLicensor2: StacProvider = {
    name: 'L2',
    roles: ['licensor'],
  };

  before(() => {
    process.env[Env.PublicUrlBase] = host;
  });
  afterEach(() => {
    config.objects.clear();
  });

  // tileset exists, imagery not found
  it('default: imagery not found', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    // insert
    config.put(FakeData.tileSetRaster(FakeTileSetName));

    // request
    const req = mockRequest(`/v1/styles/${FakeTileSetName}.json`, 'get', Api.header);
    const res = await handler.router.handle(req);
    strictEqual(res.status, 200);

    // extract
    const body = Buffer.from(res.body, 'base64').toString();
    const json = JSON.parse(body) as StyleJson;

    const source = Object.values(json.sources)[0];
    assert(source != null);
    assert(source.attribution != null);

    // verify
    strictEqual(source.attribution, defaultAttribution);
  });

  // tileset exists, imagery found, more than one layer
  it('default: too many layers', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    // insert
    const tileset = FakeData.tileSetRaster(FakeTileSetName);
    assert(tileset.layers[0] != null);

    tileset.layers.push(tileset.layers[0]);
    assert(tileset.layers.length > 1);

    config.put(tileset);
    config.put(Imagery3857);

    // request
    const req = mockRequest(`/v1/styles/${FakeTileSetName}.json`, 'get', Api.header);
    const res = await handler.router.handle(req);
    strictEqual(res.status, 200);

    // extract
    const body = Buffer.from(res.body, 'base64').toString();
    const json = JSON.parse(body) as StyleJson;

    const source = Object.values(json.sources)[0];
    assert(source != null);
    assert(source.attribution != null);

    // verify
    strictEqual(source.attribution, defaultAttribution);
  });

  // tileset exists, imagery found, one layer, no providers
  it('default: no providers', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    // insert
    const tileset = FakeData.tileSetRaster(FakeTileSetName);
    assert(tileset.layers[0] != null);
    assert(tileset.layers.length === 1);

    const imagery = Imagery3857;
    assert(imagery.providers == null);

    config.put(tileset);
    config.put(imagery);

    // request
    const req = mockRequest(`/v1/styles/${FakeTileSetName}.json`, 'get', Api.header);
    const res = await handler.router.handle(req);
    strictEqual(res.status, 200);

    // extract
    const body = Buffer.from(res.body, 'base64').toString();
    const json = JSON.parse(body) as StyleJson;

    const source = Object.values(json.sources)[0];
    assert(source != null);
    assert(source.attribution != null);

    // verify
    strictEqual(source.attribution, defaultAttribution);
  });

  // tileset exists, imagery found, one layer, has providers, no licensors
  it('default: no licensors', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    // insert
    const tileset = FakeData.tileSetRaster(FakeTileSetName);
    assert(tileset.layers[0] != null);
    assert(tileset.layers.length === 1);

    const imagery = Imagery3857;
    imagery.providers = [];
    assert(imagery.providers != null);

    config.put(tileset);
    config.put(imagery);

    // request
    const req = mockRequest(`/v1/styles/${FakeTileSetName}.json`, 'get', Api.header);
    const res = await handler.router.handle(req);
    strictEqual(res.status, 200);

    // extract
    const body = Buffer.from(res.body, 'base64').toString();
    const json = JSON.parse(body) as StyleJson;

    const source = Object.values(json.sources)[0];
    assert(source != null);
    assert(source.attribution != null);

    // verify
    strictEqual(source.attribution, defaultAttribution);
  });

  // tileset exists, imagery found, one layer, has providers, one licensor
  it('custom: one licensor', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    // insert
    const tileset = FakeData.tileSetRaster(FakeTileSetName);
    assert(tileset.layers[0] != null);
    assert(tileset.layers.length === 1);

    const imagery = Imagery3857;
    imagery.providers = [FakeLicensor1];
    assert(imagery.providers != null);

    config.put(tileset);
    config.put(imagery);

    // request
    const req = mockRequest(`/v1/styles/${FakeTileSetName}.json`, 'get', Api.header);
    const res = await handler.router.handle(req);
    strictEqual(res.status, 200);

    // extract
    const body = Buffer.from(res.body, 'base64').toString();
    const json = JSON.parse(body) as StyleJson;

    const source = Object.values(json.sources)[0];
    assert(source != null);
    assert(source.attribution != null);

    // verify
    strictEqual(source.attribution, `${copyright} ${FakeLicensor1.name}`);
    strictEqual(source.attribution, createLicensorAttribution([FakeLicensor1]));
  });

  // tileset exists, imagery found, one layer, has providers, two licensors
  it('custom: two licensors', async (t) => {
    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));

    // insert
    const tileset = FakeData.tileSetRaster(FakeTileSetName);
    assert(tileset.layers[0] != null);
    assert(tileset.layers.length === 1);

    const imagery = Imagery3857;
    imagery.providers = [FakeLicensor1, FakeLicensor2];
    assert(imagery.providers != null);

    config.put(tileset);
    config.put(imagery);

    // request
    const req = mockRequest(`/v1/styles/${FakeTileSetName}.json`, 'get', Api.header);
    const res = await handler.router.handle(req);
    strictEqual(res.status, 200);

    // extract
    const body = Buffer.from(res.body, 'base64').toString();
    const json = JSON.parse(body) as StyleJson;

    const source = Object.values(json.sources)[0];
    assert(source != null);
    assert(source.attribution != null);

    // verify
    strictEqual(source.attribution, `${copyright} ${FakeLicensor1.name}, ${FakeLicensor2.name}`);
    strictEqual(source.attribution, createLicensorAttribution([FakeLicensor1, FakeLicensor2]));
  });
});
