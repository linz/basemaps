import assert from 'node:assert';
import { describe, it } from 'node:test';

import { CompositionTiff } from '@basemaps/tiler';

import { resizeBilinear } from '../pipeline.resize.js';

describe('resize-bilinear', () => {
  it('should round numbers when working with uint arrays', () => {
    const ret = resizeBilinear(
      {
        buffer: new Uint8Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]),
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
    assert.ok(ret.buffer.every((f) => f === 1));
  });
});
