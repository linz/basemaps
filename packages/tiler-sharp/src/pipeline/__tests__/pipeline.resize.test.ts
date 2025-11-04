import assert from 'node:assert';
import { describe, it } from 'node:test';

import { CompositionTiff } from '@basemaps/tiler';

import { applyCrop, resizeBilinear } from '../pipeline.resize.js';

describe('resize-bilinear', () => {
  it('should round numbers when working with uint arrays', () => {
    const ret = resizeBilinear(
      {
        pixels: new Uint8Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
        depth: 'uint8',
        width: 4,
        height: 4,
        channels: 1,
      },
      { source: { width: 4, height: 4 } } as unknown as CompositionTiff,
      { x: 0, y: 0, width: 1, height: 1 },
      { width: 256, height: 256, scale: 123.123123123 },
    );

    // All values should be rounded to 1 and not truncated down to 0
    assert.ok(ret.pixels.every((f) => f === 1));
  });

  it('should correctly interpolate a 2x2 image to a 1x1 image', () => {
    const ret = resizeBilinear(
      {
        pixels: new Uint8Array([10, 20, 30, 40]),
        depth: 'uint8',
        width: 2,
        height: 2,
        channels: 1,
      },
      { source: { width: 2, height: 2 } } as unknown as CompositionTiff,
      { x: 0, y: 0, width: 2, height: 2 },
      { width: 1, height: 1, scale: 2 },
    );

    assert.equal(ret.pixels[0], 25);
  });
});

describe('apply-crop', () => {
  it('should apply a crop', () => {
    const ret = applyCrop(
      {
        pixels: new Uint8Array([1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]),
        depth: 'uint8',
        width: 4,
        height: 4,
        channels: 1,
      },
      { width: 2, height: 3, x: 0, y: 0 },
    );

    assert.ok(ret.pixels instanceof Uint8Array);
    assert.equal(ret.width, 2);
    assert.equal(ret.height, 3);
    assert.equal(ret.channels, 1);
    assert.equal(ret.depth, 'uint8');

    assert.deepEqual(ret.pixels, new Uint8Array([1, 1, 2, 2, 3, 3]));
  });
});
