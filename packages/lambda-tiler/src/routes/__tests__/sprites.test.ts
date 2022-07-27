import { Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import o from 'ospec';
import { gunzipSync, gzipSync } from 'zlib';
import { handler } from '../../index.js';
import { mockRequest } from '../../__tests__/xyz.util.js';
import { FsMemory } from './memory.fs.js';

o.spec('/v1/sprites', () => {
  const memory = new FsMemory();
  o.before(() => {
    fsa.register('memory://', memory);
  });

  o.beforeEach(() => {
    process.env[Env.AssetLocation] = 'memory://';
  });

  o.afterEach(() => {
    delete process.env[Env.AssetLocation];
    memory.files.clear();
  });

  o('should return 404 if no assets defined', async () => {
    delete process.env[Env.AssetLocation];
    const res404 = await handler.router.handle(mockRequest('/v1/sprites/topographic.json'));
    o(res404.status).equals(404);
  });

  o('should fetch a json document', async () => {
    await Promise.all([
      fsa.write('memory://sprites/topographic.json', Buffer.from(JSON.stringify({ test: true }))),
      fsa.write('memory://sprites/topographic.png', Buffer.from('')),
    ]);
    const res = await handler.router.handle(mockRequest('/v1/sprites/topographic.json'));
    o(res.status).equals(200);
    o(res.header('content-type')).equals('application/json');
    o(res.header('content-encoding')).equals(undefined);
    o(res.header('etag')).notEquals(undefined);
    o(res.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');

    o(JSON.parse(Buffer.from(res.body, 'base64').toString())).deepEquals({ test: true });
  });

  o('should fetch a png', async () => {
    await Promise.all([
      fsa.write('memory://sprites/topographic.json', Buffer.from(JSON.stringify({ test: true }))),
      fsa.write('memory://sprites/topographic@2x.png', Buffer.from('')),
    ]);
    const res = await handler.router.handle(mockRequest('/v1/sprites/topographic@2x.png'));
    o(res.status).equals(200);
    o(res.header('content-type')).equals('image/png');
    o(res.header('etag')).notEquals(undefined);
    o(res.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');
  });

  o('should detect gziped files and set content-encoding', async () => {
    await Promise.all([
      fsa.write('memory://sprites/topographic.json', gzipSync(Buffer.from(JSON.stringify({ test: true })))),
    ]);
    const res = await handler.router.handle(mockRequest('/v1/sprites/topographic.json'));
    o(res.status).equals(200);
    o(res.header('content-type')).equals('application/json');
    o(res.header('content-encoding')).equals('gzip');
    o(res.header('etag')).notEquals(undefined);
    o(res.header('cache-control')).equals('public, max-age=604800, stale-while-revalidate=86400');
    o(JSON.parse(gunzipSync(Buffer.from(res.body, 'base64')).toString())).deepEquals({ test: true });
  });
});
