import { before, describe, it } from 'node:test';

import { fsa } from '@basemaps/shared';
import { TestTiff } from '@basemaps/test';
import { Tiff } from '@cogeotiff/core';
import assert from 'assert';
import { createHash } from 'crypto';

import { LzwDecompressor } from '../decompressor.lzw.js';

describe('decompressor.lzw', () => {
  let tiff: Tiff;
  before(async () => {
    tiff = await Tiff.create(fsa.source(TestTiff.CompressLzw));
  });

  it('should decode a 64x64 lzw tile', async () => {
    const tile = await tiff.images[0].getTile(0, 0);

    const ret = await LzwDecompressor.decompress({
      tiff,
      imageId: 0,
      x: 0,
      y: 0,
      bytes: tile!.bytes,
    });

    const dataHash = createHash('sha256').update(ret.buffer).digest('hex');
    console.log(dataHash);

    assert.equal(ret.width, 512);
    assert.equal(ret.height, 512);
    assert.equal(ret.buffer.length, 512 * 512);
    assert.equal(ret.buffer[0], 0x02);
    assert.equal(dataHash, '21cfddfdab9b130811a6d6f62f14bf67291698e6a0659538b75bc5ab4e5983db');
  });
});
