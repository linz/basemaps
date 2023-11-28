import { ConfigProviderMemory, StyleJson } from '@basemaps/config';
import { Env } from '@basemaps/shared';
import o from 'ospec';
import { createSandbox } from 'sinon';

import { FakeData } from '../../__tests__/config.data.js';
import { Api, mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';

o.spec('/v1/styles', () => {
  const host = 'https://tiles.test';
  const config = new ConfigProviderMemory();
  const sandbox = createSandbox();

  o.before(() => {
    process.env[Env.PublicUrlBase] = host;
  });
  o.beforeEach(() => {
    sandbox.stub(ConfigLoader, 'getDefaultConfig').resolves(config);
  });
  o.afterEach(() => {
    sandbox.restore();
    config.objects.clear();
  });
  o('should not found style json', async () => {
    const request = mockRequest('/v1/tiles/topographic/Google/style/topographic.json', 'get', Api.header);
    const res = await handler.router.handle(request);
    o(res.status).equals(404);
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

  o('should serve style json', async () => {
    config.put(fakeRecord);

    const request = mockRequest('/v1/tiles/topographic/Google/style/topographic.json', 'get', Api.header);

    const res = await handler.router.handle(request);
    o(res.status).equals(200);
    o(res.header('content-type')).equals('application/json');
    o(res.header('cache-control')).equals('no-store');

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    fakeStyle.sources.basemaps_vector = {
      type: 'vector',
      url: `${host}/vector?api=${Api.key}`,
    };
    fakeStyle.sources.basemaps_raster = {
      type: 'raster',
      tiles: [`${host}/raster?api=${Api.key}`],
    };
    fakeStyle.sources.basemaps_raster_encode = {
      type: 'raster',
      tiles: [`${host}/raster/{z}/{x}/{y}.webp?api=${Api.key}`],
    };

    fakeStyle.sprite = `${host}/sprite`;
    fakeStyle.glyphs = `${host}/glyphs`;

    o(JSON.parse(body)).deepEquals(fakeStyle);
  });

  o('should serve style json with excluded layers', async () => {
    config.put(fakeRecord);
    const request = mockUrlRequest(
      '/v1/tiles/topographic/Google/style/topographic.json',
      '?exclude=background1&exclude=BACKGROUND2',
      Api.header,
    );

    const res = await handler.router.handle(request);
    o(res.status).equals(200);
    o(res.header('content-type')).equals('application/json');
    o(res.header('cache-control')).equals('no-store');

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    fakeStyle.sources.basemaps_vector = {
      type: 'vector',
      url: `${host}/vector?api=${Api.key}`,
    };
    fakeStyle.sources.basemaps_raster = {
      type: 'raster',
      tiles: [`${host}/raster?api=${Api.key}`],
    };
    fakeStyle.sources.basemaps_raster_encode = {
      type: 'raster',
      tiles: [`${host}/raster/{z}/{x}/{y}.webp?api=${Api.key}`],
    };

    fakeStyle.sprite = `${host}/sprite`;
    fakeStyle.glyphs = `${host}/glyphs`;
    fakeStyle.layers = [fakeStyle.layers[2]];

    o(JSON.parse(body)).deepEquals(fakeStyle);
  });

  o('should create raster styles', async () => {
    const request = mockUrlRequest('/v1/styles/aerial.json', '', Api.header);
    const tileSet = FakeData.tileSetRaster('aerial');
    config.put(tileSet);
    const res = await handler.router.handle(request);
    o(res.status).equals(200);

    const body = JSON.parse(Buffer.from(res.body, 'base64').toString());

    o(body.version).equals(8);
    o(body.sources['basemaps-aerial'].type).deepEquals('raster');
    o(body.sources['basemaps-aerial'].tiles).deepEquals([
      `https://tiles.test/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=${Api.key}`,
    ]);
    o(body.sources['basemaps-aerial'].tileSize).deepEquals(256);
    o(body.layers).deepEquals([{ id: 'basemaps-aerial', type: 'raster', source: 'basemaps-aerial' }]);
  });

  o('should support parameters', async () => {
    const request = mockUrlRequest('/v1/styles/aerial.json', '?tileMatrix=NZTM2000Quad&format=jpg', Api.header);
    const tileSet = FakeData.tileSetRaster('aerial');
    config.put(tileSet);
    const res = await handler.router.handle(request);
    o(res.status).equals(200);

    const body = JSON.parse(Buffer.from(res.body, 'base64').toString());

    o(body.version).equals(8);
    o(body.sources['basemaps-aerial'].type).deepEquals('raster');
    o(body.sources['basemaps-aerial'].tiles).deepEquals([
      `https://tiles.test/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.jpeg?api=${Api.key}`,
    ]);
    o(body.sources['basemaps-aerial'].tileSize).deepEquals(256);
    o(body.layers).deepEquals([{ id: 'basemaps-aerial', type: 'raster', source: 'basemaps-aerial' }]);
  });

  o('should create raster styles from custom config', async () => {
    const configId = FakeData.bundle([FakeData.tileSetRaster('aerial')]);
    const request = mockUrlRequest('/v1/styles/aerial.json', `?config=${configId}`, Api.header);

    const res = await handler.router.handle(request);
    o(res.status).equals(200);

    const body = JSON.parse(Buffer.from(res.body, 'base64').toString());

    o(body.version).equals(8);
    o(body.sources['basemaps-aerial'].type).deepEquals('raster');
    o(body.sources['basemaps-aerial'].tiles).deepEquals([
      `https://tiles.test/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=${Api.key}&config=${configId}`,
    ]);
    o(body.sources['basemaps-aerial'].tileSize).deepEquals(256);
    o(body.layers).deepEquals([{ id: 'basemaps-aerial', type: 'raster', source: 'basemaps-aerial' }]);
  });
});
