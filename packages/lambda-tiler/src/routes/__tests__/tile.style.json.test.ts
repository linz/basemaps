import assert from 'node:assert';
import { afterEach, before, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory, StyleJson } from '@basemaps/config';
import { Env } from '@basemaps/shared';
import { createSandbox } from 'sinon';

import { FakeData } from '../../__tests__/config.data.js';
import { Api, mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';

describe('/v1/styles', () => {
  const host = 'https://tiles.test';
  const config = new ConfigProviderMemory();
  const sandbox = createSandbox();

  before(() => {
    process.env[Env.PublicUrlBase] = host;
  });
  beforeEach(() => {
    sandbox.stub(ConfigLoader, 'getDefaultConfig').resolves(config);
  });
  afterEach(() => {
    sandbox.restore();
    config.objects.clear();
  });
  it('should not found style json', async () => {
    const request = mockRequest('/v1/tiles/topographic/Google/style/topographic.json', 'get', Api.header);
    const res = await handler.router.handle(request);
    assert.equal(res.status, 404);
  });

  const fakeStyle: StyleJson = {
    version: 8,
    id: 'test',
    name: 'topographic',
    sources: {
      basemaps_vector: {
        type: 'vector',
        url: `/vector`,
      },
      basemaps_raster: {
        type: 'raster',
        tiles: [`/raster`],
      },
      basemaps_raster_encode: {
        type: 'raster',
        tiles: [`/raster/{z}/{x}/{y}.webp`], // Shouldn't encode the {}
      },
      test_vector: {
        type: 'vector',
        url: 'vector.url.co.nz',
      },
      test_raster: {
        type: 'raster',
        tiles: ['raster.url.co.nz'],
      },
    },
    layers: [
      {
        layout: {
          visibility: 'visible',
        },
        paint: {
          'background-color': 'rgba(206, 229, 242, 1)',
        },
        id: 'Background1',
        type: 'background',
        minzoom: 0,
      },
      {
        layout: {
          visibility: 'visible',
        },
        paint: {
          'background-color': 'rgba(206, 229, 242, 1)',
        },
        id: 'Background2',
        type: 'background',
        minzoom: 0,
      },
      {
        layout: {
          visibility: 'visible',
        },
        paint: {
          'background-color': 'rgba(206, 229, 242, 1)',
        },
        id: 'Background3',
        type: 'background',
        minzoom: 0,
      },
    ],
    glyphs: '/glyphs',
    sprite: '/sprite',
    metadata: { id: 'test' },
  };

  const fakeRecord = {
    id: 'st_topographic',
    name: 'topographic',
    style: fakeStyle,
  };

  it('should serve style json', async () => {
    config.put(fakeRecord);

    const request = mockRequest('/v1/tiles/topographic/Google/style/topographic.json', 'get', Api.header);

    const res = await handler.router.handle(request);
    assert.equal(res.status, 200, res.statusDescription);
    assert.equal(res.header('content-type'), 'application/json');
    assert.equal(res.header('cache-control'), 'no-store');

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    fakeStyle.sources['basemaps_vector'] = {
      type: 'vector',
      url: `${host}/vector?api=${Api.key}`,
    };
    fakeStyle.sources['basemaps_raster'] = {
      type: 'raster',
      tiles: [`${host}/raster?api=${Api.key}`],
    };
    fakeStyle.sources['basemaps_raster_encode'] = {
      type: 'raster',
      tiles: [`${host}/raster/{z}/{x}/{y}.webp?api=${Api.key}`],
    };

    fakeStyle.sprite = `${host}/sprite`;
    fakeStyle.glyphs = `${host}/glyphs`;

    assert.deepEqual(JSON.parse(body), fakeStyle);
  });

  it('should serve style json with excluded layers', async () => {
    config.put(fakeRecord);
    const request = mockUrlRequest(
      '/v1/tiles/topographic/Google/style/topographic.json',
      '?exclude=background1&exclude=BACKGROUND2',
      Api.header,
    );

    const res = await handler.router.handle(request);
    assert.equal(res.status, 200, res.statusDescription);
    assert.equal(res.header('content-type'), 'application/json');
    assert.equal(res.header('cache-control'), 'no-store');

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    fakeStyle.sources['basemaps_vector'] = {
      type: 'vector',
      url: `${host}/vector?api=${Api.key}`,
    };
    fakeStyle.sources['basemaps_raster'] = {
      type: 'raster',
      tiles: [`${host}/raster?api=${Api.key}`],
    };
    fakeStyle.sources['basemaps_raster_encode'] = {
      type: 'raster',
      tiles: [`${host}/raster/{z}/{x}/{y}.webp?api=${Api.key}`],
    };

    fakeStyle.sprite = `${host}/sprite`;
    fakeStyle.glyphs = `${host}/glyphs`;
    fakeStyle.layers = [fakeStyle.layers[2]];

    assert.deepEqual(JSON.parse(body), fakeStyle);
  });

  it('should create raster styles', async () => {
    const request = mockUrlRequest('/v1/styles/aerial.json', '', Api.header);
    const tileSet = FakeData.tileSetRaster('aerial');
    config.put(tileSet);
    const res = await handler.router.handle(request);
    assert.equal(res.status, 200, res.statusDescription);

    const body = JSON.parse(Buffer.from(res.body, 'base64').toString());

    assert.equal(body.version, 8);
    assert.deepEqual(body.sources['basemaps-aerial'].type, 'raster');
    assert.deepEqual(body.sources['basemaps-aerial'].tiles, [
      `https://tiles.test/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=${Api.key}`,
    ]);
    assert.deepEqual(body.sources['basemaps-aerial'].tileSize, 256);
    assert.deepEqual(body.layers, [{ id: 'basemaps-aerial', type: 'raster', source: 'basemaps-aerial' }]);
  });

  it('should support parameters', async () => {
    const request = mockUrlRequest('/v1/styles/aerial.json', '?tileMatrix=NZTM2000Quad&format=jpg', Api.header);
    const tileSet = FakeData.tileSetRaster('aerial');
    config.put(tileSet);
    const res = await handler.router.handle(request);
    assert.equal(res.status, 200, res.statusDescription);

    const body = JSON.parse(Buffer.from(res.body, 'base64').toString());

    assert.equal(body.version, 8);
    assert.deepEqual(body.sources['basemaps-aerial'].type, 'raster');
    assert.deepEqual(body.sources['basemaps-aerial'].tiles, [
      `https://tiles.test/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.jpeg?api=${Api.key}`,
    ]);
    assert.deepEqual(body.sources['basemaps-aerial'].tileSize, 256);
    assert.deepEqual(body.layers, [{ id: 'basemaps-aerial', type: 'raster', source: 'basemaps-aerial' }]);
  });

  it('should create raster styles from custom config', async () => {
    const configId = FakeData.bundle([FakeData.tileSetRaster('aerial')]);
    const request = mockUrlRequest('/v1/styles/aerial.json', `?config=${configId}`, Api.header);

    const res = await handler.router.handle(request);
    assert.equal(res.status, 200, res.statusDescription);

    const body = JSON.parse(Buffer.from(res.body, 'base64').toString());

    assert.equal(body.version, 8);
    assert.deepEqual(body.sources['basemaps-aerial'].type, 'raster');
    assert.deepEqual(body.sources['basemaps-aerial'].tiles, [
      `https://tiles.test/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=${Api.key}&config=${configId}`,
    ]);
    assert.deepEqual(body.sources['basemaps-aerial'].tileSize, 256);
    assert.deepEqual(body.layers, [{ id: 'basemaps-aerial', type: 'raster', source: 'basemaps-aerial' }]);
  });
});
