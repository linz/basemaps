import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory, ConfigTileSetRaster } from '@basemaps/config';
import { Env } from '@basemaps/shared';

import { Imagery2193, Imagery3857, Provider, TileSetAerial } from '../../__tests__/config.data.js';
import { Api, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';

describe('WMTSRouting', () => {
  const config = new ConfigProviderMemory();
  const imagery = new Map();

  beforeEach(() => {
    imagery.set(Imagery3857.id, Imagery3857);
    imagery.set(Imagery2193.id, Imagery2193);

    config.put(TileSetAerial);
    config.put(Imagery2193);
    config.put(Imagery3857);
    config.put(Provider);
  });

  afterEach(() => {
    config.objects.clear();
  });

  it('should default to the aerial layer', async (t) => {
    t.mock.method(Env, 'get', (arg: string) => {
      if (arg === Env.PublicUrlBase) return 'https://tiles.test';
      return process.env[arg];
    });
    t.mock.method(ConfigLoader, 'load', () => Promise.resolve(config));

    const req = mockUrlRequest(
      '/v1/tiles/WMTSCapabilities.xml',
      `format=png&api=${Api.key}&config=s3://linz-basemaps/config.json`,
    );
    const res = await handler.router.handle(req);

    assert.equal(res.status, 200);
    const lines = Buffer.from(res.body, 'base64').toString().split('\n');

    const titles = lines.filter((f) => f.startsWith('      <ows:Title>')).map((f) => f.trim());

    assert.deepEqual(titles, [
      '<ows:Title>Aerial Imagery</ows:Title>',
      '<ows:Title>Ōtorohanga 0.1m Urban Aerial Photos (2021)</ows:Title>',
      '<ows:Title>Google Maps Compatible for the World</ows:Title>',
      '<ows:Title>LINZ NZTM2000 Map Tile Grid V2</ows:Title>',
    ]);

    const resourceURLs = lines.filter((f) => f.includes('<ResourceURL')).map((f) => f.trim());
    assert.deepEqual(resourceURLs, [
      '<ResourceURL format="image/png" resourceType="tile" template="https://tiles.test/v1/tiles/aerial/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png?api=d01f7w7rnhdzg0p7fyrc9v9ard1&amp;config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M" />',
      '<ResourceURL format="image/png" resourceType="tile" template="https://tiles.test/v1/tiles/ōtorohanga-urban-2021-0.1m/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png?api=d01f7w7rnhdzg0p7fyrc9v9ard1&amp;config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M" />',
    ]);
  });

  it('should 404 when no layers are found', async (t) => {
    t.mock.method(Env, 'get', (arg: string) => {
      if (arg === Env.PublicUrlBase) return 'https://tiles.test';
      return process.env[arg];
    });
    t.mock.method(ConfigLoader, 'load', () => Promise.resolve(config));

    config.put({ ...TileSetAerial, id: 'ts_all', name: 'all', layers: [] } as ConfigTileSetRaster);

    const req = mockUrlRequest(
      '/v1/tiles/all/WMTSCapabilities.xml',
      `format=png&api=${Api.key}&config=s3://linz-basemaps/config.json`,
    );

    const res = await handler.router.handle(req);

    assert.equal(res.status, 404);
    assert.equal(res.statusDescription, 'No layers found for tile set: ts_all');
  });
});
