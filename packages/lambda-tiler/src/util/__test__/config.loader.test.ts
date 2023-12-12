import assert from 'node:assert';
import { afterEach, before, beforeEach, describe, it } from 'node:test';

import { base58, ConfigProviderMemory } from '@basemaps/config';
import { fsa } from '@basemaps/shared';
import { FsMemory } from '@chunkd/source-memory';
import { LambdaHttpResponse } from '@linzjs/lambda';
import { createSandbox } from 'sinon';

import { FakeData } from '../../__tests__/config.data.js';
import { Api, mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { CachedConfig } from '../config.cache.js';
import { ConfigLoader } from '../config.loader.js';

describe('ConfigLoader', () => {
  const memory = new FsMemory();
  const config = new ConfigProviderMemory();
  const sandbox = createSandbox();

  before(() => {
    fsa.register('memory://', memory);
  });

  beforeEach(() => {
    sandbox.stub(ConfigLoader, 'getDefaultConfig').resolves(config);
  });

  afterEach(() => {
    sandbox.restore();
    config.objects.clear();
    memory.files.clear();
    CachedConfig.cache.clear();
  });

  it('should return default config', async () => {
    const provider = await ConfigLoader.load(mockRequest('/v1/fonts.json'));
    assert.deepEqual(provider, config);
  });

  it('should Not working with wrong config url', async () => {
    const error = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=notapath`, Api.header),
    )
      .then(() => null)
      .catch((e) => e);

    assert.equal(error instanceof LambdaHttpResponse, true);
    assert.equal((error as LambdaHttpResponse).status, 400);
    assert.equal((error as LambdaHttpResponse).statusDescription, 'Invalid config location');
  });

  it('should Not working with wrong protocol', async () => {
    const error = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=memory1://linz-basemaps/config`, Api.header),
    )
      .then(() => null)
      .catch((e) => e);

    assert.equal(error instanceof LambdaHttpResponse, true);
    assert.equal((error as LambdaHttpResponse).status, 400);
    assert.equal((error as LambdaHttpResponse).statusDescription, 'Invalid configuration location protocol:memory1');
  });

  it('should Not working with wrong s3 bucket', async () => {
    const error = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=s3://wrong-bucket/config`, Api.header),
    )
      .then(() => null)
      .catch((e) => e);

    assert.equal(error instanceof LambdaHttpResponse, true);
    assert.equal((error as LambdaHttpResponse).status, 400);
    assert.equal(
      (error as LambdaHttpResponse).statusDescription,
      'Bucket: "wrong-bucket" is not a allowed bucket location',
    );
  });

  const location = 'memory://linz-basemaps/config.json';

  it('should Not working with no file in the path', async () => {
    const error = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=${location}`, Api.header),
    )
      .then(() => null)
      .catch((e) => e);

    assert.equal(error instanceof LambdaHttpResponse, true);
    assert.equal((error as LambdaHttpResponse).status, 400);
    assert.equal((error as LambdaHttpResponse).statusDescription, `Invalid config location at ${location}`);
  });

  it('should get expected config file', async () => {
    const expectedConfig = new ConfigProviderMemory();
    expectedConfig.put(FakeData.tileSetRaster('aerial'));
    await fsa.write(location, Buffer.from(JSON.stringify(expectedConfig.toJson())));

    const provider = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=${location}`, Api.header),
    );

    assert.deepEqual(await provider.Imagery.get('aerial'), await expectedConfig.Imagery.get('aerial'));
  });

  it('should get expected config file with base58 location', async () => {
    const expectedConfig = new ConfigProviderMemory();
    expectedConfig.put(FakeData.tileSetVector('topographic'));
    await fsa.write(location, Buffer.from(JSON.stringify(expectedConfig.toJson())));

    const provider = await ConfigLoader.load(
      mockUrlRequest(
        '/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json',
        `?config=${base58.encode(Buffer.from(location))}`,
        Api.header,
      ),
    );

    assert.deepEqual(await provider.Imagery.get('topographic'), await expectedConfig.Imagery.get('topographic'));
  });

  const deletedLocation = 'memory://linz-basemaps/config-deleted.json';
  it('should Error 400 if config file not exists', async () => {
    const error = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=${deletedLocation}`, Api.header),
    )
      .then(() => null)
      .catch((e) => e);

    assert.equal(error instanceof LambdaHttpResponse, true);
    assert.equal((error as LambdaHttpResponse).status, 400);
    assert.equal((error as LambdaHttpResponse).statusDescription, `Invalid config location at ${deletedLocation}`);
  });
});
