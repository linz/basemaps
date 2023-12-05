import { fsa } from '@chunkd/fs';
import { FsMemory } from '@chunkd/source-memory';
import o from 'ospec';

import { loadStacFromURL } from '../tiff.config.js';

o.spec('loadStacFromURL', () => {
  const mem = new FsMemory();
  o.beforeEach(() => fsa.register('memory://', mem));
  o.afterEach(() => mem.files.clear());
  o('should load a json document', async () => {
    await mem.write('memory://foo/imagery/collection.json', JSON.stringify({ hello: 'world' }));

    const result = await loadStacFromURL(new URL('memory://foo/imagery/'));
    o(result as unknown).deepEquals({ hello: 'world' });
  });

  o('should load from trailing slash', async () => {
    await mem.write('memory://foo/imagery/collection.json', JSON.stringify({ hello: 'world' }));

    const result = await loadStacFromURL(new URL('memory://foo/imagery'));
    o(result as unknown).deepEquals({ hello: 'world' });
  });

  o('should load from prefixes', async () => {
    await mem.write('memory://foo/collection.json', JSON.stringify({ foo: 'bar' }));

    const result = await loadStacFromURL(new URL('memory://foo/imagery'));
    o(result as unknown).deepEquals({ foo: 'bar' });
  });
  o('should prioritize loading from more specific locations', async () => {
    await mem.write('memory://foo/imagery/collection.json', JSON.stringify({ hello: 'world' }));
    await mem.write('memory://foo/collection.json', JSON.stringify({ hello: 'Bar' }));

    const result = await loadStacFromURL(new URL('memory://foo/imagery'));
    o(result as unknown).deepEquals({ hello: 'world' });
  });
});
