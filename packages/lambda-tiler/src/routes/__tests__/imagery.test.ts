import assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { fsa, FsMemory } from '@chunkd/fs';

import { Imagery3857 } from '../../__tests__/config.data.js';
import { mockRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { isAllowedFile } from '../imagery.js';

describe('ImageryRoute', () => {
  const memory = new FsMemory();
  const config = new ConfigProviderMemory();

  before(() => {
    fsa.register('memory://imagery/', memory);
  });

  beforeEach(() => {
    config.assets = 'fake-s3://assets/';
  });

  it('should allow geojson and json files only', () => {
    assert.equal(isAllowedFile('foo.geojson'), true);
    assert.equal(isAllowedFile('foo.json'), true);
    assert.equal(isAllowedFile('foo.tiff'), false);
    assert.equal(isAllowedFile('foo'), false);
    assert.equal(isAllowedFile(''), false);
    assert.equal(isAllowedFile(null as unknown as string), false);
  });

  it('should force download geojson files', async (t) => {
    const fakeImagery = { ...Imagery3857 };
    config.put(fakeImagery);
    fakeImagery.uri = 'memory://imagery/';

    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));
    const res404 = await handler.router.handle(mockRequest(`/v1/imagery/${fakeImagery.id}/capture-area.geojson`));
    assert.equal(res404.status, 404);

    await memory.write(fsa.toUrl('memory://imagery/capture-area.geojson'), JSON.stringify({ hello: 'world' }));

    const res200 = await handler.router.handle(mockRequest(`/v1/imagery/${fakeImagery.id}/capture-area.geojson`));
    assert.equal(res200.status, 200);
    assert.equal(res200.headers.get('content-disposition'), 'attachment');
  });

  it('should fetch stac files', async (t) => {
    const fakeImagery = { ...Imagery3857 };
    config.put(fakeImagery);
    fakeImagery.uri = 'memory://imagery/';

    t.mock.method(ConfigLoader, 'getDefaultConfig', () => Promise.resolve(config));
    const res404 = await handler.router.handle(mockRequest(`/v1/imagery/${fakeImagery.id}/collection.json`));
    assert.equal(res404.status, 404);

    await memory.write(fsa.toUrl('memory://imagery/collection.json'), JSON.stringify({ hello: 'world' }));

    const res200 = await handler.router.handle(mockRequest(`/v1/imagery/${fakeImagery.id}/collection.json`));
    assert.equal(res200.status, 200);
    assert.equal(res200.headers.get('content-disposition'), undefined);
  });
});
