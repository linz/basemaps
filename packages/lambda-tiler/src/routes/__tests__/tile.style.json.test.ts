import { ConfigProviderMemory, StyleJson } from '@basemaps/config';
import { Env } from '@basemaps/shared';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { Api, mockRequest } from '../../__tests__/xyz.util.js';

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

  o('should serve style json', async () => {
    const request = mockRequest('/v1/tiles/topographic/Google/style/topographic.json', 'get', Api.header);

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
          id: 'Background',
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

    config.put(fakeRecord);

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
});
