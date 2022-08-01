import { ConfigBundled } from '@basemaps/config';
import { Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import o from 'ospec';
import * as ulid from 'ulid';
import { handler } from '../../index.js';
import { assetProvider } from '../../util/assets.provider.js';
import { mockRequest, mockUrlRequest } from '../../__tests__/xyz.util.js';
import { fontList } from '../fonts.js';
import { FsMemory } from './memory.fs.js';

o.spec('/v1/fonts', () => {
  const memory = new FsMemory();
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
    assetProvider.set(undefined);
    const res = await fontList(mockRequest('/v1/fonts.json'));
    o(res.status).equals(404);
  });

  o('should return 404 if config record not found', async () => {
    const config = 'memory://config.json';
    const res = await fontList(mockUrlRequest('/v1/fonts.json', `config=${config}`));
    o(res.status).equals(404);
  });

  o('should get correct record from the config asset location', async () => {
    const id = ulid.ulid();
    const config = 'memory://config.json';
    const assets = 'memory://assets/';
    const cfg: ConfigBundled = {
      id: `cb_${id}`,
      hash: '01g6phsge6rmy3812gdr2twgb7',
      assets,
      imagery: [],
      style: [],
      provider: [],
      tileSet: [],
    };
    await Promise.all([
      fsa.write(config, Buffer.from(JSON.stringify(cfg))),
      fsa.write('memory://assets/fonts/Roboto Thin/0-255.pbf', Buffer.from('')),
    ]);

    const res255 = await handler.router.handle(mockUrlRequest('/v1/fonts/Roboto Thin/0-255.pbf', `config=${config}`));
    o(res255.status).equals(200);
    o(res255.header('content-type')).equals('application/x-protobuf');
    o(res255.header('content-encoding')).equals(undefined);
    o(res255.header('etag')).notEquals(undefined);
    o(res255.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');
  });
});
