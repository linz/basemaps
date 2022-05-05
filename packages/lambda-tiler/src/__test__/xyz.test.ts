import { ConfigProvider, StyleJson } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms, TileMatrixSets } from '@basemaps/geo';
import { Config, Env, LogConfig, VNodeParser } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding.js';
import o from 'ospec';
import sinon from 'sinon';
import { handleRequest } from '../index.js';
import { TileEtag } from '../routes/tile.etag.js';
import { TileSets } from '../tile.set.cache.js';
import { TileComposer } from '../tile.set.raster.js';
import { FakeTileSet, FakeTileSetVector, mockRequest, Provider } from './xyz.util.js';

const sandbox = sinon.createSandbox();

const TileSetNames = ['aerial', 'aerial@head', 'aerial@beta', '01E7PJFR9AMQFJ05X9G7FQ3XMW'];
/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('LambdaXyz', () => {
  const host = 'https://tiles.test';
  const origPublicUrlBase = process.env[Env.PublicUrlBase];

  /** Generate mock ALBEvent */

  let rasterMock = o.spy();
  const generateMock = o.spy(() => 'foo');
  const rasterMockBuffer = Buffer.from([1]);
  const origTileEtag = TileEtag.generate;
  const origCompose = TileComposer.compose;

  const apiKey = 'd01f7w7rnhdzg0p7fyrc9v9ard1';
  const apiKeyHeader = { 'x-linz-api-key': 'd01f7w7rnhdzg0p7fyrc9v9ard1' };

  o.beforeEach(() => {
    process.env[Env.PublicUrlBase] = host;

    LogConfig.disable();
    // tileMock = o.spy(() => tileMockData) as any;
    rasterMock = o.spy(() => {
      return {
        buffer: rasterMockBuffer,
      };
    }) as any;

    TileEtag.generate = generateMock;
    TileComposer.compose = rasterMock as any;

    const allMatrix = [...TileMatrixSets.All.values()];
    for (const tileSetName of TileSetNames) {
      for (const tileMatrix of allMatrix) {
        const tileSet = new FakeTileSet(tileSetName, tileMatrix);
        TileSets.add(tileSet);
        tileSet.getTiffsForTile = (): [] => [];
        tileSet.initTiffs = async () => [];
      }
    }

    TileSets.add(new FakeTileSetVector('topographic', GoogleTms));

    (Config.Provider as any).get = async (): Promise<ConfigProvider> => Provider;
  });

  o.afterEach(() => {
    TileSets.cache.clear();
    TileComposer.compose = origCompose;
    TileEtag.generate = origTileEtag;
    process.env[Env.PublicUrlBase] = origPublicUrlBase;
    sandbox.restore();
  });

  o('should export handler', async () => {
    const base = await import('../index.js');
    o(typeof base.handler).equals('function');
  });

  TileSetNames.forEach((tileSetName) => {
    o(`should generate a tile 0,0,0 for ${tileSetName}.png`, async () => {
      o.timeout(200);
      const request = mockRequest(`/v1/tiles/${tileSetName}/global-mercator/0/0/0.png`, 'get', apiKeyHeader);
      const res = await handleRequest(request);
      o(res.status).equals(200);
      o(res.header('content-type')).equals('image/png');
      o(res.header('eTaG')).equals('foo');
      o(res.body).equals(rasterMockBuffer.toString('base64'));

      // Validate the session information has been set correctly
      o(request.logContext['tileSet']).equals(tileSetName);
      o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
      o(round(request.logContext['location'])).deepEquals({ lat: 0, lon: 0 });
    });
  });

  o('should generate a tile 0,0,0 for webp', async () => {
    const request = mockRequest('/v1/tiles/aerial/3857/0/0/0.webp', 'get', apiKeyHeader);
    const res = await handleRequest(request);
    o(res.status).equals(200);
    o(res.header('content-type')).equals('image/webp');
    o(res.header('eTaG')).equals('foo');
    o(res.body).equals(rasterMockBuffer.toString('base64'));

    // Validate the session information has been set correctly
    o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
    o(round(request.logContext['location'])).deepEquals({ lat: 0, lon: 0 });
  });

  ['png', 'webp', 'jpeg'].forEach((fmt) => {
    o(`should 200 with empty ${fmt} if a tile is out of bounds`, async () => {
      // tiler.tile = async () => [];
      const res = await handleRequest(
        mockRequest(`/v1/tiles/aerial/global-mercator/0/0/0.${fmt}`, 'get', apiKeyHeader),
      );
      o(res.status).equals(200);
      o(res.header('content-type')).equals(`image/${fmt}`);
      o(rasterMock.calls.length).equals(1);
    });
  });

  o('should 304 if a tile is not modified', async () => {
    const key = 'foo';
    const request = mockRequest('/v1/tiles/aerial/global-mercator/0/0/0.png', 'get', {
      'if-none-match': key,
      ...apiKeyHeader,
    });
    const res = await handleRequest(request);
    o(res.status).equals(304);
    o(res.header('eTaG')).equals(undefined);

    o(rasterMock.calls.length).equals(0);
    o(request.logContext['cache']).deepEquals({ key, match: key, hit: true });
  });

  o('should 404 if a tile is outside of the range', async () => {
    try {
      const res = await handleRequest(mockRequest('/v1/tiles/aerial/global-mercator/25/0/0.png', 'get', apiKeyHeader));
      o(res.status).equals(404);
    } catch (e: any) {
      o(e.status).equals(404);
    }
    try {
      const res = await handleRequest(mockRequest('/v1/tiles/aerial/2193/17/0/0.png', 'get', apiKeyHeader));
      o(res.status).equals(404);
    } catch (e: any) {
      o(e.status).equals(404);
    }
  });

  o.spec('WMTSCapabilities', () => {
    o('should 304 if a xml is not modified', async () => {
      delete process.env[Env.PublicUrlBase];
      o.timeout(1000);
      const key = 'NuirTK8fozzCJV1iG1FznmdHhKvk6WaWuDhhEA1d40c=';
      const request = mockRequest('/v1/tiles/WMTSCapabilities.xml', 'get', {
        'if-none-match': key,
        ...apiKeyHeader,
      });

      const res = await handleRequest(request);

      if (res.status === 200) {
        o(res.header('eTaG')).equals(key); // this line is useful for discovering the new etag
        return;
      }

      o(res.status).equals(304);
      o(rasterMock.calls.length).equals(0);

      o(request.logContext['cache']).deepEquals({ key, match: key, hit: true });
    });

    o('should serve WMTSCapabilities for tile_set', async () => {
      const request = mockRequest('/v1/tiles/aerial@beta/WMTSCapabilities.xml', 'get', apiKeyHeader);

      const res = await handleRequest(request);
      o(res.status).equals(200);
      o(res.header('content-type')).equals('text/xml');
      o(res.header('cache-control')).equals('max-age=0');

      const body = Buffer.from(res.body ?? '', 'base64').toString();
      o(body.slice(0, 100)).equals(
        '<?xml version="1.0"?>\n' + '<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.op',
      );

      const vdom = await VNodeParser.parse(body);
      const url = vdom.tags('ResourceURL').next().value;
      o(url?.toString()).equals(
        '<ResourceURL format="image/jpeg" resourceType="tile" ' +
          `template="https://tiles.test/v1/tiles/aerial@beta/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.jpeg?api=${apiKey}" />`,
      );
    });
  });

  o.spec('tileJson', () => {
    o('should 404 if invalid url is given', async () => {
      const request = mockRequest('/v1/tiles/tile.json', 'get', apiKeyHeader);

      const res = await handleRequest(request);
      o(res.status).equals(404);
    });

    o('should serve tile json for tile_set', async () => {
      const request = mockRequest('/v1/tiles/aerial/NZTM2000Quad/tile.json', 'get', apiKeyHeader);

      const res = await handleRequest(request);
      o(res.status).equals(200);
      o(res.header('cache-control')).equals('no-store');

      const body = Buffer.from(res.body ?? '', 'base64').toString();
      o(JSON.parse(body)).deepEquals({
        tiles: [`https://tiles.test/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.webp?api=${apiKey}`],
        vector_layers: [],
        tilejson: '3.0.0',
      });
    });

    o('should serve vector tiles', async () => {
      const request = mockRequest('/v1/tiles/topographic/WebMercatorQuad/tile.json', 'get', apiKeyHeader);

      const res = await handleRequest(request);
      o(res.status).equals(200);

      const body = Buffer.from(res.body ?? '', 'base64').toString();
      o(JSON.parse(body)).deepEquals({
        tiles: [`https://tiles.test/v1/tiles/topographic/EPSG:3857/{z}/{x}/{y}.pbf?api=${apiKey}`],
        vector_layers: [],
        tilejson: '3.0.0',
      });
    });

    o('should serve vector tiles with min/max zoom', async () => {
      const fakeTileSet = new FakeTileSetVector('fake-vector', GoogleTms);
      fakeTileSet.tileSet.maxZoom = 15;
      fakeTileSet.tileSet.minZoom = 3;
      TileSets.add(fakeTileSet);
      const request = mockRequest('/v1/tiles/fake-vector/WebMercatorQuad/tile.json', 'get', apiKeyHeader);

      const res = await handleRequest(request);
      o(res.status).equals(200);

      const body = Buffer.from(res.body ?? '', 'base64').toString();
      o(JSON.parse(body)).deepEquals({
        tiles: [`https://tiles.test/v1/tiles/fake-vector/EPSG:3857/{z}/{x}/{y}.pbf?api=${apiKey}`],
        vector_layers: [],
        maxzoom: 15,
        minzoom: 3,
        tilejson: '3.0.0',
      });
    });

    o('should serve convert zoom to tile matrix', async () => {
      const fakeTileSet = new FakeTileSetVector('fake-vector', Nztm2000QuadTms);
      fakeTileSet.tileSet.maxZoom = 15;
      fakeTileSet.tileSet.minZoom = 1;
      TileSets.add(fakeTileSet);

      const request = mockRequest('/v1/tiles/fake-vector/NZTM2000Quad/tile.json', 'get', apiKeyHeader);

      const res = await handleRequest(request);
      o(res.status).equals(200);

      const body = Buffer.from(res.body ?? '', 'base64').toString();
      o(JSON.parse(body)).deepEquals({
        tiles: [`https://tiles.test/v1/tiles/fake-vector/NZTM2000Quad/{z}/{x}/{y}.pbf?api=${apiKey}`],
        vector_layers: [],
        maxzoom: 13,
        minzoom: 0,
        tilejson: '3.0.0',
      });
    });
  });

  o.spec('styleJson', () => {
    o('should not found style json', async () => {
      const request = mockRequest('/v1/tiles/topographic/Google/style/topographic.json', 'get', apiKeyHeader);

      sandbox.stub(Config.Style, 'get').resolves(null);

      const res = await handleRequest(request);
      o(res.status).equals(404);
    });

    o('should serve style json', async () => {
      const request = mockRequest('/v1/tiles/topographic/Google/style/topographic.json', 'get', apiKeyHeader);

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
        id: 'st_topographic_production',
        name: 'topographic',
        style: fakeStyle,
      };

      sandbox.stub(Config.Style, 'get').resolves(fakeRecord as any);

      const res = await handleRequest(request);
      o(res.status).equals(200);
      o(res.header('content-type')).equals('application/json');
      o(res.header('cache-control')).equals('no-store');

      const body = Buffer.from(res.body ?? '', 'base64').toString();
      fakeStyle.sources.basemaps_vector = {
        type: 'vector',
        url: `${host}/vector?api=${apiKey}`,
      };
      fakeStyle.sources.basemaps_raster = {
        type: 'raster',
        tiles: [`${host}/raster?api=${apiKey}`],
      };
      fakeStyle.sources.basemaps_raster_encode = {
        type: 'raster',
        tiles: [`${host}/raster/{z}/{x}/{y}.webp?api=${apiKey}`],
      };

      fakeStyle.sprite = `${host}/sprite`;
      fakeStyle.glyphs = `${host}/glyphs`;

      o(JSON.parse(body)).deepEquals(fakeStyle);
    });
  });

  ['/favicon.ico', '/index.html', '/foo/bar'].forEach((path) => {
    o('should error on invalid paths: ' + path, async () => {
      const res = await handleRequest(mockRequest(path, 'get', apiKeyHeader));
      o(res.status).equals(404);
    });
  });
});
