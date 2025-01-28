import assert from 'node:assert';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';

import { fsa, LogConfig } from '@basemaps/shared';
// import { TestTiff } from '@basemaps/test';
import { Tiff } from '@cogeotiff/core';

import { LzwDecompressor, LzwDecompressorSharp } from '../decompressor.lzw.js';

describe('decompressor.lzw', () => {
  let tiff: Tiff;
  before(async () => {
    tiff = await Tiff.create(
      fsa.source(fsa.toUrl('file:///home/blacha/data/elevation/nz-8m-dem-2012/8m-dem-small/qd.lzw.tiff')),
    );
  });

  it('should decode a 64x64 lzw tile', async () => {
    LogConfig.get().level = 'silent';
    const hashes: Record<string, { hash: string; duration: number }> = {};
    const hashesSharp: Record<string, { hash: string; duration: number }> = {};

    for (const img of tiff.images) {
      const imageId = img.id;
      for (let x = 0; x < img.tileCount.x; x++) {
        for (let y = 0; y < img.tileCount.y; y++) {
          const tile = await img.getTile(x, y);
          if (tile == null) continue;

          const tileId = `${imageId}_${x}_${y}`;
          const startTime = performance.now();
          const ret = await LzwDecompressorSharp.decompress({
            tiff,
            imageId,
            x,
            y,
            bytes: tile.bytes,
          });

          const hashSharp = createHash('sha256').update(ret.buffer).digest('hex');
          hashesSharp[tileId] = {
            hash: hashSharp,
            duration: performance.now() - startTime,
          };

          const startTimeB = performance.now();
          const retB = await LzwDecompressor.decompress({
            tiff,
            imageId,
            x,
            y,
            bytes: tile.bytes,
          });

          const hashLzw = createHash('sha256').update(retB.buffer).digest('hex');
          hashes[tileId] = {
            hash: hashLzw,
            duration: performance.now() - startTimeB,
          };

          assert.equal(hashLzw, hashSharp, tileId);
        }
      }
    }
    // writeFileSync('./hashes.json', JSON.stringify(hashes, null, 2));

    // writeFileSync('./hashesSharp.json', JSON.stringify(hashesSharp, null, 2));
  });
});
