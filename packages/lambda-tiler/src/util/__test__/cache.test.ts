import assert from 'node:assert';
import { describe, it } from 'node:test';

import { fsa, FsMemory } from '@chunkd/fs';

import { SourceCache } from '../source.cache.js';

describe('CoSourceCache', () => {
  it('should not exit if a promise rejection happens', async () => {
    const cache = new SourceCache(5);

    const mem = new FsMemory();
    const tiffLoc = new URL('memory://foo/bar.tiff');
    await mem.write(tiffLoc, Buffer.from('ABC123'));
    fsa.register('memory://', mem);

    await cache.getCog(tiffLoc).catch(() => null);
    assert.equal(cache.cache.currentSize, 1);
  });
});
