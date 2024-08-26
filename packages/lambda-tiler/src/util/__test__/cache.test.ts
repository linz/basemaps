import assert from 'node:assert';
import { describe, it } from 'node:test';

import { fsa, FsMemory } from '@chunkd/fs';

import { SourceCache } from '../source.cache.js';

describe('CoSourceCache', () => {
  it('should not exit if a promise rejection happens for tiff', async () => {
    const cache = new SourceCache(5);

    const mem = new FsMemory();
    const tiffLoc = new URL('memory://foo/bar.tiff');
    await mem.write(tiffLoc, Buffer.from('ABC123'));
    fsa.register('memory://', mem);

    let failCount = 0;
    await cache.getCog(tiffLoc).catch(() => failCount++);
    assert.equal(cache.cache.currentSize, 0);
    assert.equal(failCount, 1);
  });

  it('should not exit if a promise rejection happens for tar', async () => {
    const cache = new SourceCache(5);

    const mem = new FsMemory();
    const tiffLoc = new URL('memory://foo/bar.tar');
    await mem.write(tiffLoc, Buffer.from('ABC123'));
    fsa.register('memory://', mem);

    let failCount = 0;
    await cache.getCotar(tiffLoc).catch(() => failCount++);
    assert.equal(cache.cache.currentSize, 0);
    assert.equal(failCount, 1);
  });
});
