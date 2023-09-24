import { base58, ConfigProviderMemory } from '@basemaps/config';
import { fsa } from '@basemaps/shared';
import { LambdaHttpResponse } from '@linzjs/lambda';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { FsMemory } from '@chunkd/source-memory';
import { FakeData } from '../../__tests__/config.data.js';
import { Api, mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { CachedConfig } from '../config.cache.js';
import { ConfigLoader } from '../config.loader.js';

o.spec('ConfigLoader', () => {
  const memory = new FsMemory();
  const config = new ConfigProviderMemory();
  const sandbox = createSandbox();

  o.before(() => {
    fsa.register('memory://', memory);
  });

  o.beforeEach(() => {
    sandbox.stub(ConfigLoader, 'getDefaultConfig').resolves(config);
  });

  o.afterEach(() => {
    sandbox.restore();
    config.objects.clear();
    memory.files.clear();
    CachedConfig.cache.clear();
  });

  o('should return default config', async () => {
    const provider = await ConfigLoader.load(mockRequest('/v1/fonts.json'));
    o(provider).deepEquals(config);
  });

  o('should Not working with wrong config url', async () => {
    const error = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=notapath`, Api.header),
    )
      .then(() => null)
      .catch((e) => e);

    o(error instanceof LambdaHttpResponse).equals(true);
    o((error as LambdaHttpResponse).status).equals(400);
    o((error as LambdaHttpResponse).statusDescription).equals('Invalid config location');
  });

  o('should Not working with wrong protocol', async () => {
    const error = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=memory1://linz-basemaps/config`, Api.header),
    )
      .then(() => null)
      .catch((e) => e);

    o(error instanceof LambdaHttpResponse).equals(true);
    o((error as LambdaHttpResponse).status).equals(400);
    o((error as LambdaHttpResponse).statusDescription).equals('Invalid configuration location protocol:memory1');
  });

  o('should Not working with wrong s3 bucket', async () => {
    const error = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=s3://wrong-bucket/config`, Api.header),
    )
      .then(() => null)
      .catch((e) => e);

    o(error instanceof LambdaHttpResponse).equals(true);
    o((error as LambdaHttpResponse).status).equals(400);
    o((error as LambdaHttpResponse).statusDescription).equals(
      'Bucket: "wrong-bucket" is not a allowed bucket location',
    );
  });

  const location = 'memory://linz-basemaps/config.json';

  o('should Not working with no file in the path', async () => {
    const error = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=${location}`, Api.header),
    )
      .then(() => null)
      .catch((e) => e);

    o(error instanceof LambdaHttpResponse).equals(true);
    o((error as LambdaHttpResponse).status).equals(404);
    o((error as LambdaHttpResponse).statusDescription).equals(`Config not found at ${location}`);
  });

  o('should get expected config file', async () => {
    const expectedConfig = new ConfigProviderMemory();
    expectedConfig.put(FakeData.tileSetRaster('aerial'));
    await fsa.write(location, Buffer.from(JSON.stringify(expectedConfig.toJson())));

    const provider = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=${location}`, Api.header),
    );

    o(await provider.Imagery.get('aerial')).deepEquals(await expectedConfig.Imagery.get('aerial'));
  });

  o('should get expected config file with base58 location', async () => {
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

    o(await provider.Imagery.get('topographic')).deepEquals(await expectedConfig.Imagery.get('topographic'));
  });

  const deletedLocation = 'memory://linz-basemaps/config-deleted.json';
  o('should Error 404 if config file not exists', async () => {
    const error = await ConfigLoader.load(
      mockUrlRequest('/v1/tiles/🦄 🌈/NZTM2000Quad/tile.json', `?config=${deletedLocation}`, Api.header),
    )
      .then(() => null)
      .catch((e) => e);

    o(error instanceof LambdaHttpResponse).equals(true);
    o((error as LambdaHttpResponse).status).equals(404);
    o((error as LambdaHttpResponse).statusDescription).equals(`Config not found at ${deletedLocation}`);
  });
});
