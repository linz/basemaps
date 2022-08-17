import { ConfigProviderMemory } from '@basemaps/config';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { Imagery2193, Imagery3857, Provider, TileSetAerial } from '../../__tests__/config.data.js';
import { Api, mockUrlRequest } from '../../__tests__/xyz.util.js';

o.spec('WMTSRouting', () => {
  const sandbox = createSandbox();
  const config = new ConfigProviderMemory();

  o.before(() => {
    sandbox.stub(ConfigLoader, 'load').resolves(config);
  });

  o.afterEach(() => {
    config.objects.clear();
    sandbox.restore();
  });

  o('should default to the aerial layer', async () => {
    const imagery = new Map();
    imagery.set(Imagery3857.id, Imagery3857);
    imagery.set(Imagery2193.id, Imagery2193);

    config.put(TileSetAerial);
    config.put(Imagery2193);
    config.put(Imagery3857);
    config.put(Provider);

    const req = mockUrlRequest('/v1/tiles/WMTSCapabilities.xml', `format=png&api=${Api.key}`);
    const res = await handler.router.handle(req);

    o(res.status).equals(200);
    const lines = Buffer.from(res.body, 'base64').toString().split('\n');

    const titles = lines.filter((f) => f.startsWith('      <ows:Title>')).map((f) => f.trim());

    o(titles).deepEquals([
      '<ows:Title>Aerial Imagery</ows:Title>',
      '<ows:Title>Ōtorohanga 0.1m Urban Aerial Photos (2021)</ows:Title>',
      '<ows:Title>Google Maps Compatible for the World</ows:Title>',
      '<ows:Title>LINZ NZTM2000 Map Tile Grid V2</ows:Title>',
    ]);
  });
});
