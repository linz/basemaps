// import assert from 'node:assert';
// import { afterEach, beforeEach, describe, it } from 'node:test';

// import { fsa, FsMemory } from '@basemaps/shared';

// import { loadStacFromURL } from '../tiff.config.js';

// describe('loadStacFromURL', () => {
//   const mem = new FsMemory();
//   beforeEach(() => fsa.register('memory://', mem));
//   afterEach(() => mem.files.clear());
//   it('should load a json document', async () => {
//     await mem.write(new URL('memory://foo/imagery/collection.json'), JSON.stringify({ hello: 'world' }));

//     const result = await loadStacFromURL(new URL('memory://foo/imagery/'));
//     assert.deepEqual(result as unknown, { hello: 'world' });
//   });

//   it('should load from trailing slash', async () => {
//     await mem.write(new URL('memory://foo/imagery/collection.json'), JSON.stringify({ hello: 'world' }));

//     const result = await loadStacFromURL(new URL('memory://foo/imagery'));
//     assert.deepEqual(result as unknown, { hello: 'world' });
//   });

//   it('should load from prefixes', async () => {
//     await mem.write(new URL('memory://foo/collection.json'), JSON.stringify({ foo: 'bar' }));

//     const result = await loadStacFromURL(new URL('memory://foo/imagery'));
//     assert.deepEqual(result as unknown, { foo: 'bar' });
//   });
//   it('should prioritize loading from more specific locations', async () => {
//     await mem.write(new URL('memory://foo/imagery/collection.json'), JSON.stringify({ hello: 'world' }));
//     await mem.write(new URL('memory://foo/collection.json'), JSON.stringify({ hello: 'Bar' }));

//     const result = await loadStacFromURL(new URL('memory://foo/imagery'));
//     assert.deepEqual(result as unknown, { hello: 'world' });
//   });
// });
