// import { SourceMemory } from '@chunkd/core';
// import { CogTiff } from '@cogeotiff/core';
// import o from 'ospec';
// import { CoSources } from '../util/source.cache';

// /** convert number to megabytes */
// const MegaBytes = (num: number): number => num * 1024 * 1024;

// o.spec('CoSources', () => {
//   o.beforeEach(() => CoSources.clear());

//   o('should cache items', () => {
//     const source = new SourceMemory('fake', Buffer.from('foo'));
//     const tiff = new CogTiff(source);

//     o(CoSources.cache.get('fake')).equals(null);
//     CoSources.set('fake', tiff);
//     o(CoSources.get('fake')?.source.uri).equals(tiff.source.uri);

//     CoSources.check();
//     o(CoSources.get('fake')?.source.uri).equals(tiff.source.uri);
//   });

//   o('should expire cached object if size gets too large', () => {
//     const source = new SourceMemory('fake', Buffer.from('foo'));
//     const sourceB = new SourceMemory('fakeB', Buffer.from('foo'));

//     // Override chunk size to say there is 500 mb of items
//     source.chunkSize = MegaBytes(257);
//     sourceB.chunkSize = MegaBytes(257);

//     const tiff = new CogTiff(source);
//     const tiffB = new CogTiff(sourceB);

//     o(CoSources.get('fake')).equals(null);

//     CoSources.set('fake', tiff);
//     o(CoSources.get('fake')?.source.uri).equals(tiff.source.uri);

//     CoSources.check();
//     o(CoSources.cacheA.get('fake')?.source.uri).equals(undefined);
//     o(CoSources.cacheB.get('fake')?.source.uri).equals(tiff.source.uri);

//     // Should evict the cache
//     CoSources.set('fakeB', tiffB);
//     CoSources.check();

//     o(CoSources.cacheA.get('fake')?.source.uri).equals(undefined);
//     o(CoSources.cacheB.get('fake')?.source.uri).equals(undefined);
//   });

//   o('should allow multiple items in the cache', () => {
//     const source = new SourceMemory('fake', Buffer.from('foo'));
//     const tiff = new CogTiff(source);

//     CoSources.set('fake', tiff);
//     const oneMb = MegaBytes(1);
//     source.chunkSize = oneMb;

//     for (let i = 1; i < 256; i++) {
//       o(CoSources.currentSize).equals(i * oneMb);
//       source.chunks.set(i, source.chunks.get(0)!);
//     }
//     // should not have overflown
//     CoSources.check();
//     o(CoSources.cacheA.size).equals(1);
//     // Overflow the cache
//     source.chunks.set(257, source.chunks.get(0)!);

//     CoSources.check();
//     o(CoSources.cacheA.size).equals(0);
//   });
// });
