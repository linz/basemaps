import { strictEqual } from 'node:assert';
import { afterEach, before, describe, test } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import { createSandbox } from 'sinon';

import { FakeData, Imagery3857 } from '../../__tests__/config.data.js';
import { mockRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';

const NAME = 'tileset';
const PATH = `/v1/link/${NAME}`;

describe('/v1/link/:tileSet', () => {
  const config = new ConfigProviderMemory();
  const sandbox = createSandbox();

  before(() => {
    sandbox.stub(ConfigLoader, 'getDefaultConfig').resolves(config);
  });

  afterEach(() => {
    config.objects.clear();
  });

  /**
   * 3xx status responses
   */

  // tileset found, has one layer, has '3857' entry, imagery found > 302 response
  test('success: redirect to pre-zoomed imagery', async () => {
    config.put(FakeData.tileSetRaster(NAME));
    config.put(Imagery3857);

    const req = mockRequest(PATH);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 302);
    strictEqual(res.statusDescription, 'Redirect to pre-zoomed imagery');
  });

  /**
   * 4xx status responses
   */

  // tileset not found > 404 response
  test('failure: tileset not found', async () => {
    const req = mockRequest(PATH);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 404);
    strictEqual(res.statusDescription, 'Tileset not found');
  });

  // tileset found, has more than one layer > 400 response
  test('failure: too many layers', async () => {
    const tileSet = FakeData.tileSetRaster(NAME);

    // add another layer
    tileSet.layers.push(tileSet.layers[0]);

    config.put(tileSet);

    const req = mockRequest(PATH);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 400);
    strictEqual(res.statusDescription, 'Too many layers');
  });

  // tileset found, has one layer, no '3857' entry > 400 response
  test("failure: no imagery for '3857' projection", async () => {
    const tileSet = FakeData.tileSetRaster(NAME);

    // delete '3857' entry
    delete tileSet.layers[0][Epsg.Google.code];

    config.put(tileSet);

    const req = mockRequest(PATH);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 400);
    strictEqual(res.statusDescription, "No imagery for '3857' projection");
  });

  // tileset found, has one layer, has '3857' entry, imagery not found > 400 response
  test('failure: imagery not found', async () => {
    config.put(FakeData.tileSetRaster(NAME));

    const req = mockRequest(PATH);
    const res = await handler.router.handle(req);

    strictEqual(res.status, 400);
    strictEqual(res.statusDescription, 'Imagery not found');
  });
});
