import { ConfigBundle } from '@basemaps/config';
import { Config, Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { handler } from '../../index.js';
import { assetProvider } from '../../util/assets.provider.js';
import { mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { fontList } from '../fonts.js';
import { FsMemory } from './memory.fs.js';

o.spec('/v1/fonts', () => {
  const memory = new FsMemory();
  const sandbox = createSandbox();
  o.before(() => {
    fsa.register('memory://', memory);
  });
  const assetLocation = process.env[Env.AssetLocation];

  o.beforeEach(() => {
    process.env[Env.AssetLocation] = 'memory://';
    assetProvider.set('memory://');
  });

  o.afterEach(() => {
    assetProvider.set(assetLocation);
    memory.files.clear();
    sandbox.restore();
  });

  o('should return 404 if no font found', async () => {
    const res = await fontList(mockRequest('/v1/fonts.json'));
    o(res.status).equals(404);
  });

  o('should return a list of fonts found', async () => {
    await await fsa.write('memory://fonts.json', Buffer.from(JSON.stringify(['Roboto Black', 'Roboto Thin'])));
    const res = await fontList(mockRequest('/v1/fonts.json'));
    o(res.status).equals(200);
    o(res.header('content-type')).equals('application/json');
    o(res.header('content-encoding')).equals(undefined);
    o(res._body?.toString()).equals(JSON.stringify(['Roboto Black', 'Roboto Thin']));
  });

  o('should get the correct font', async () => {
    await fsa.write('memory://fonts/Roboto Thin/0-255.pbf', Buffer.from(''));

    const res255 = await handler.router.handle(mockRequest('/v1/fonts/Roboto Thin/0-255.pbf'));
    o(res255.status).equals(200);
    o(res255.header('content-type')).equals('application/x-protobuf');
    o(res255.header('content-encoding')).equals(undefined);
    o(res255.header('etag')).notEquals(undefined);
    o(res255.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');

    const res404 = await handler.router.handle(mockRequest('/v1/fonts/Roboto Thin/256-512.pbf'));
    o(res404.status).equals(404);
  });

  o('should get the correct utf8 font', async () => {
    await fsa.write('memory://fonts/🦄 🌈/0-255.pbf', Buffer.from(''));

    const res255 = await handler.router.handle(mockRequest('/v1/fonts/🦄 🌈/0-255.pbf'));
    o(res255.status).equals(200);
    o(res255.header('content-type')).equals('application/x-protobuf');
    o(res255.header('content-encoding')).equals(undefined);
    o(res255.header('etag')).notEquals(undefined);
    o(res255.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');
  });

  o('should return 404 if no asset location set', async () => {
    assetProvider.set(undefined);
    const res = await fontList(mockRequest('/v1/fonts.json'));
    o(res.status).equals(404);
  });

  o('should return 404 if config record not found', async () => {
    const configId = 'cb_01g6phsge6rmy3812gdr2twgb7';
    sandbox.stub(Config.ConfigBundle, 'get').resolves(null);
    const res = await fontList(mockUrlRequest('/v1/fonts.json', `config=${configId}`));
    o(res.status).equals(404);
  });

  o('should get correct record from the config asset location', async () => {
    const configId = 'cb_01g6phsge6rmy3812gdr2twgb7';
    const assets = 'memory://assets/';
    const configBundle: ConfigBundle = {
      id: configId,
      name: configId,
      path: 's3://basemaps/config.json',
      hash: 'BcSvC4eS6ym5kDZiJkd5wBWbpaKWdQrxK',
      assets,
    };
    sandbox.stub(Config.ConfigBundle, 'get').resolves(configBundle);
    await fsa.write('memory://assets/fonts/Roboto Thin/0-255.pbf', Buffer.from(''));

    const res255 = await handler.router.handle(mockUrlRequest('/v1/fonts/Roboto Thin/0-255.pbf', `config=${configId}`));
    o(res255.status).equals(200);
    o(res255.header('content-type')).equals('application/x-protobuf');
    o(res255.header('content-encoding')).equals(undefined);
    o(res255.header('etag')).notEquals(undefined);
    o(res255.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');
  });
});
