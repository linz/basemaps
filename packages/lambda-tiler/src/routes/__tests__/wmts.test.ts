import { Config } from '@basemaps/shared';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { handler } from '../../index.js';
import { Imagery2193, Imagery3857, Provider, TileSetAerial } from '../../__tests__/config.data.js';
import { Api, mockUrlRequest } from '../../__tests__/xyz.util.js';

o.spec('WMTSRouting', () => {
  const sandbox = createSandbox();
  o.afterEach(() => {
    sandbox.restore();
  });

  o('should default to the aerial layer', async () => {
    const imagery = new Map();
    imagery.set(Imagery3857.id, Imagery3857);
    imagery.set(Imagery2193.id, Imagery2193);

    const tileSetStub = sandbox.stub(Config.TileSet, 'get').returns(Promise.resolve(TileSetAerial));
    const imageryStub = sandbox.stub(Config.Imagery, 'getAll').returns(Promise.resolve(imagery));
    const providerStub = sandbox.stub(Config.Provider, 'get').returns(Promise.resolve(Provider));

    const req = mockUrlRequest('/v1/tiles/WMTSCapabilities.xml', `format=png&api=${Api.key}`);
    const res = await handler.router.handle(req);

    o(tileSetStub.calledOnce).equals(true);
    o(tileSetStub.args[0][0]).equals('ts_aerial');

    o(providerStub.calledOnce).equals(true);
    o(providerStub.args[0][0]).equals('pv_linz');

    o(imageryStub.calledOnce).equals(true);
    o([...imageryStub.args[0][0].values()]).deepEquals([
      'im_01FYWKATAEK2ZTJQ2PX44Y0XNT',
      'im_01FYWKAJ86W9P7RWM1VB62KD0H',
    ]);

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
