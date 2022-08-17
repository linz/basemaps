import { ConfigProviderMemory } from '@basemaps/config';
import { Env } from '@basemaps/shared';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { FakeData } from '../../__tests__/config.data.js';
import { Api, mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';

o.spec('arcgis/VectorTileServer', () => {
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
    const request = mockUrlRequest('/v1/arcgis/rest/services/topographic/VectorTileServer', 'f=json', Api.header);

    const res = await handler.router.handle(request);
    o(res.status).equals(404);
  });
  o('should return the vector tile server', async () => {
    const request = mockUrlRequest('/v1/arcgis/rest/services/topographic/VectorTileServer', 'f=json', Api.header);

    config.put(FakeData.tileSetVector('topographic'));

    const res = await handler.router.handle(request);
    o(res.status).equals(200);
    o(res.header('content-type')).equals('application/json');
    o(res.header('cache-control')).equals('no-store');

    const body = JSON.parse(Buffer.from(res.body ?? '', 'base64').toString());
    o(body.tiles[0]).equals(`${host}/v1/tiles/topographic/WebMercatorQuad/{z}/{x}/{y}.pbf?api=${Api.key}`);
    o(body.tileInfo.lods.length).equals(17);
  });
  o('should not return with no f=json query', async () => {
    const request = mockRequest('/v1/arcgis/rest/services/topographic/VectorTileServer', 'get', Api.header);

    config.put(FakeData.tileSetVector('topographic'));

    const res = await handler.router.handle(request);
    o(res.status).equals(404);
  });
  o('should return ok for post request', async () => {
    const request = mockUrlRequest(
      '/v1/arcgis/rest/services/topographic/VectorTileServer',
      'f=json',
      Api.header,
      'POST',
    );

    config.put(FakeData.tileSetVector('topographic'));

    const res = await handler.router.handle(request);
    o(res.status).equals(200);
    o(res.body).deepEquals(`{"id":"${request.id}","correlationId":"${request.correlationId}","message":"ok"}`);
  });
});
