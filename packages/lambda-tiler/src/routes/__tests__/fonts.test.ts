import { Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import o from 'ospec';
import { handler } from '../../index.js';
import { mockRequest } from '../../__tests__/xyz.util.js';
import { fontList } from '../fonts.js';
import { FsMemory } from './memory.fs.js';

o.spec('/v1/fonts', () => {
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

  o('should return 404 for non font.json', async () => {
    const res = await fontList();
    o(res.status).equals(404);
  });

  o('should return 404 if no assets defined', async () => {
    delete process.env[Env.AssetLocation];
    const res = await fontList();
    o(res.status).equals(404);
  });

  o('should return a list of fonts found', async () => {
    await fsa.write('memory://fonts.json', Buffer.from(JSON.stringify(['Roboto Black', 'Roboto Thin'])));
    const res = await fontList();
    o(res.status).equals(200);
    o(res.header('content-type')).equals('application/json');
    o(res.header('content-encoding')).equals(undefined);
    o(res._body?.toString()).equals(JSON.stringify(['Roboto Black', 'Roboto Thin']));
  });

  o('should get the correct font', async () => {
    await fsa.write('memory://fonts/Roboto Thin/0-255.pbf', Buffer.from(''));

    const res255 = await handler.router.handle(mockRequest(encodeURI('/v1/fonts/Roboto Thin/0-255.pbf')));
    o(res255.status).equals(200);
    o(res255.header('content-type')).equals('application/x-protobuf');
    o(res255.header('content-encoding')).equals(undefined);

    const res404 = await handler.router.handle(mockRequest('/v1/fonts/Roboto Thin/256-512.pbf'));
    o(res404.status).equals(404);
  });

  o('should get the correct utf8 font', async () => {
    await fsa.write('memory://fonts/🦄 🌈/0-255.pbf', Buffer.from(''));

    const res255 = await handler.router.handle(mockRequest(encodeURI('/v1/fonts/🦄 🌈/0-255.pbf')));
    o(res255.status).equals(200);
    o(res255.header('content-type')).equals('application/x-protobuf');
    o(res255.header('content-encoding')).equals(undefined);
  });
});
