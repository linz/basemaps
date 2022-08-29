import { base58, ConfigProviderMemory } from '@basemaps/config';
import { Env, getDefaultConfig } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import o from 'ospec';
import { handler } from '../../index.js';
import { CachedConfig } from '../../util/config.cache.js';
import { CoSources } from '../../util/source.cache.js';
import { Api, mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { fontList } from '../fonts.js';
import { FsMemory } from './memory.fs.js';

o.spec('/v1/fonts', () => {
  const memory = new FsMemory();
  o.before(() => {
    fsa.register('memory://', memory);
  });
  const assetLocation = process.env[Env.AssetLocation];

  o.beforeEach(() => {
    process.env[Env.AssetLocation] = 'memory://config';
    getDefaultConfig().assets = 'memory://';
  });

  o.afterEach(() => {
    getDefaultConfig().assets = assetLocation;
    CachedConfig.cache.clear();
    CoSources.cache.clear();
    memory.files.clear();
  });

  o('should return 404 if no font found', async () => {
    const res = await fontList(mockRequest('/v1/fonts.json'));
    o(res.status).equals(404);
  });

  o('should return a list of fonts found', async () => {
    await fsa.write('memory://fonts.json', Buffer.from(JSON.stringify(['Roboto Black', 'Roboto Thin'])));
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
    getDefaultConfig().assets = undefined;
    const res = await fontList(mockRequest('/v1/fonts.json'));
    o(res.status).equals(404);
  });

  o('should get the correct utf8 font with default assets', async () => {
    const cfgBundle = new ConfigProviderMemory();
    await fsa.write('memory://linz-basemaps/bar.json', JSON.stringify(cfgBundle.toJson()));
    await fsa.write('memory://config/fonts/🦄 🌈/0-255.pbf', Buffer.from(''));

    const configLocation = base58.encode(Buffer.from('memory://linz-basemaps/bar.json'));
    const res255 = await handler.router.handle(
      mockUrlRequest('/v1/fonts/🦄 🌈/0-255.pbf', `?config=${configLocation}`, Api.header),
    );
    o(res255.status).equals(200);
    o(res255.header('content-type')).equals('application/x-protobuf');
    o(res255.header('content-encoding')).equals(undefined);
    o(res255.header('etag')).notEquals(undefined);
    o(res255.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');
  });

  o('should get the correct utf8 font with config assets', async () => {
    const cfgBundle = new ConfigProviderMemory();
    cfgBundle.assets = 'memory://config/assets';
    await fsa.write('memory://linz-basemaps/bar.json', JSON.stringify(cfgBundle.toJson()));
    await fsa.write('memory://config/assets/fonts/🦄 🌈/0-255.pbf', Buffer.from(''));

    const configLocation = base58.encode(Buffer.from('memory://linz-basemaps/bar.json'));
    const res255 = await handler.router.handle(
      mockUrlRequest('/v1/fonts/🦄 🌈/0-255.pbf', `?config=${configLocation}`, Api.header),
    );
    o(res255.status).equals(200);
    o(res255.header('content-type')).equals('application/x-protobuf');
    o(res255.header('content-encoding')).equals(undefined);
    o(res255.header('etag')).notEquals(undefined);
    o(res255.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');
  });
});
