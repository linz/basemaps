import { Config, ConfigProviderMemory } from '@basemaps/config';
import { Env } from '@basemaps/shared';
import o from 'ospec';
import { handler } from '../../index.js';
import { CoSources } from '../../util/source.cache.js';
import { FakeData } from '../../__tests__/config.data.js';
import { Api, mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';

o.spec('/v1/tiles/:tileSet/:tileMatrix/tile.json', () => {
  const config = new ConfigProviderMemory();
  o.before(() => {
    process.env[Env.PublicUrlBase] = 'https://tiles.test';
    Config.setConfigProvider(config);
  });

  o.beforeEach(() => {
    config.objects.clear();
    CoSources.cache.clear();
  });

  o('should 404 if invalid url is given', async () => {
    const request = mockRequest('/v1/tiles/tile.json', 'get', Api.header);

    const res = await handler.router.handle(request);
    o(res.status).equals(404);
  });

  o('should support utf8 tilesets', async () => {
    const request = mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `api=${Api.key}`);
    o(request.path).equals('/v1/tiles/%F0%9F%A6%84%20%F0%9F%8C%88/NZTM2000Quad/tile.json');

    const fakeTileSet = FakeData.tileSetRaster('🦄 🌈');
    config.put(fakeTileSet);

    const res = await handler.router.handle(request);
    o(res.status).equals(200);
  });

  o('should serve tile json for tile_set', async () => {
    const request = mockRequest('/v1/tiles/aerial/NZTM2000Quad/tile.json', 'get', Api.header);
    const fakeTileSet = FakeData.tileSetRaster('aerial');
    config.put(fakeTileSet);

    const res = await handler.router.handle(request);
    o(res.status).equals(200);
    o(res.header('cache-control')).equals('no-store');

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    o(JSON.parse(body)).deepEquals({
      tiles: [`https://tiles.test/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.webp?api=${Api.key}`],
      tilejson: '3.0.0',
    });
  });

  o('should use the correct format', async () => {
    const request = mockRequest('/v1/tiles/aerial/NZTM2000Quad/tile.json', 'get', Api.header);
    request.query.set('format', 'jpeg');

    const fakeTileSet = FakeData.tileSetRaster('aerial');
    config.put(fakeTileSet);

    const res = await handler.router.handle(request);
    o(res.status).equals(200);
    o(res.header('cache-control')).equals('no-store');

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    o(JSON.parse(body)).deepEquals({
      tiles: [`https://tiles.test/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.jpeg?api=${Api.key}`],
      tilejson: '3.0.0',
    });
  });

  o('should use the correct format when multiple set', async () => {
    const request = mockRequest('/v1/tiles/aerial/NZTM2000Quad/tile.json', 'get', Api.header);
    request.query.append('format', 'png');
    request.query.append('format', 'jpeg');

    const fakeTileSet = FakeData.tileSetRaster('aerial');
    config.put(fakeTileSet);

    const res = await handler.router.handle(request);
    o(res.status).equals(200);
    o(res.header('cache-control')).equals('no-store');

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    o(JSON.parse(body)).deepEquals({
      tiles: [`https://tiles.test/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.png?api=${Api.key}`],
      tilejson: '3.0.0',
    });
  });

  o('should serve vector tiles', async () => {
    const request = mockRequest('/v1/tiles/topographic/EPSG:3857/tile.json', 'get', Api.header);
    const fakeTileSet = FakeData.tileSetVector('topographic');
    config.put(fakeTileSet);

    const res = await handler.router.handle(request);
    o(res.status).equals(200);

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    o(JSON.parse(body)).deepEquals({
      tiles: [`https://tiles.test/v1/tiles/topographic/WebMercatorQuad/{z}/{x}/{y}.pbf?api=${Api.key}`],
      tilejson: '3.0.0',
    });
  });

  o('should serve vector tiles with min/max zoom', async () => {
    const fakeTileSet = FakeData.tileSetVector('fakvector');
    fakeTileSet.maxZoom = 15;
    fakeTileSet.minZoom = 3;
    config.put(fakeTileSet);
    const request = mockRequest('/v1/tiles/fake-vector/WebMercatorQuad/tile.json', 'get', Api.header);

    const res = await handler.router.handle(request);
    o(res.status).equals(200);

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    o(JSON.parse(body)).deepEquals({
      tiles: [`https://tiles.test/v1/tiles/fake-vector/WebMercatorQuad/{z}/{x}/{y}.pbf?api=${Api.key}`],
      maxzoom: 15,
      minzoom: 3,
      tilejson: '3.0.0',
    });
  });

  o('should serve convert zoom to tile matrix', async () => {
    const fakeTileSet = FakeData.tileSetVector('fakvector');
    fakeTileSet.maxZoom = 15;
    fakeTileSet.minZoom = 1;
    config.put(fakeTileSet);

    const request = mockRequest('/v1/tiles/fake-vector/NZTM2000Quad/tile.json', 'get', Api.header);

    const res = await handler.router.handle(request);
    o(res.status).equals(200);

    const body = Buffer.from(res.body ?? '', 'base64').toString();
    o(JSON.parse(body)).deepEquals({
      tiles: [`https://tiles.test/v1/tiles/fake-vector/NZTM2000Quad/{z}/{x}/{y}.pbf?api=${Api.key}`],
      maxzoom: 13,
      minzoom: 0,
      tilejson: '3.0.0',
    });
  });
});
