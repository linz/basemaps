import { BaseConfig, ConfigProviderMemory, StyleJson } from '@basemaps/config';
import { Env } from '@basemaps/shared';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { FakeData } from '../../__tests__/config.data.js';
import { Api, mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';

o.spec('arcgis/stylejson', () => {
  const host = 'https://tiles.test';
  const sandbox = createSandbox();
  const config = new ConfigProviderMemory();

  o.before(() => {
    process.env[Env.PublicUrlBase] = host;
  });

  o.beforeEach(() => {
    sandbox.stub(ConfigLoader, 'load').resolves(config);
    config.objects.clear();
  });

  o.afterEach(() => {
    sandbox.restore();
  });

  o('should not found tile set', async () => {
    const request = mockRequest('/v1/arcgis/rest/services/topographic/VectorTileServer/root.json', 'get', Api.header);

    const res = await handler.router.handle(request);
    o(res.status).equals(404);
  });

  o('should not found style', async () => {
    const request = mockRequest('/v1/arcgis/rest/services/topographic/VectorTileServer/root.json', 'get', Api.header);
    config.put(FakeData.tileSetVector('topographic'));

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
    },
    layers: [
      {
        source: 'basemaps_vector',
        layout: {
          visibility: 'visible',
        },
        paint: {
          'background-color': 'rgba(206, 229, 242, 1)',
        },
        id: 'Background-vector',
        type: 'background',
        minzoom: 0,
      },
      {
        source: 'basemaps_raster',
        layout: {
          visibility: 'visible',
        },
        paint: {
          'background-color': 'rgba(222, 229, 132, 1)',
        },
        id: 'Background-raster',
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

  o('should serve style json and remove the raster source and layers, then replace the vector url', async () => {
    const request = mockRequest('/v1/arcgis/rest/services/topographic/VectorTileServer/root.json', 'get', Api.header);

    config.put(FakeData.tileSetVector('topographic'));
    config.put(fakeRecord);

    const res = await handler.router.handle(request);
    o(res.status).equals(200);
    o(res.header('content-type')).equals('application/json');
    o(res.header('cache-control')).equals('no-store');

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    fakeStyle.sources.basemaps_vector = {
      type: 'vector',
      url: `${host}/v1/arcgis/rest/services/topographic/VectorTileServer?api=${Api.key}&f=json`,
    };
    delete fakeStyle.sources.basemaps_raster;
    fakeStyle.layers = [fakeStyle.layers[0]];

    fakeStyle.sprite = `${host}/sprite`;
    fakeStyle.glyphs = `${host}/glyphs`;

    o(JSON.parse(body)).deepEquals(fakeStyle);
  });

  o('should not found for raster tileset', async () => {
    const request = mockRequest('/v1/arcgis/rest/services/raster/VectorTileServer/root.json', 'get', Api.header);

    config.put(FakeData.tileSetRaster('raster'));
    config.put(fakeRecord);

    const res = await handler.router.handle(request);
    o(res.status).equals(404);
  });

  o('should fine the new style with url query', async () => {
    const request = mockUrlRequest(
      '/v1/arcgis/rest/services/topographic/VectorTileServer/root.json',
      'style=topolite',
      Api.header,
    );

    config.put({ id: 'st_topolite', name: 'topographic', style: fakeStyle } as BaseConfig);
    config.put(FakeData.tileSetVector('topographic'));

    const res = await handler.router.handle(request);
    o(res.status).equals(200);
    o(res.header('content-type')).equals('application/json');
    o(res.header('cache-control')).equals('no-store');

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    fakeStyle.sources.basemaps_vector = {
      type: 'vector',
      url: `${host}/v1/arcgis/rest/services/topographic/VectorTileServer?api=${Api.key}&f=json`,
    };
    delete fakeStyle.sources.basemaps_raster;
    fakeStyle.layers = [fakeStyle.layers[0]];

    fakeStyle.sprite = `${host}/sprite`;
    fakeStyle.glyphs = `${host}/glyphs`;

    o(JSON.parse(body)).deepEquals(fakeStyle);
  });
});
