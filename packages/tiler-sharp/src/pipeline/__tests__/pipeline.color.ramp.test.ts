import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Tiff } from '@basemaps/shared';
import { CompositionTiff } from '@basemaps/tiler';

import { DecompressedInterleaved } from '../decompressor.js';
import { PipelineColorRamp } from '../pipeline.color.ramp.js';

const FakeTiff = { images: [{ noData: -9999, resolution: [0.1, -0.1] }] } as unknown as Tiff;
const FakeComp = { asset: FakeTiff, source: { x: 0, y: 0, imageId: 0 } } as CompositionTiff;

describe('pipeline.color-ramp', () => {
  it('should color-ramp a float32 DEM with default ramp', async () => {
    const bytes: DecompressedInterleaved = {
      buffer: new Float32Array([-9999, 0, 100]),
      depth: 'float32',
      channels: 1,
      width: 3,
      height: 1,
    };

    const output = await PipelineColorRamp.process(FakeComp, bytes);

    assert.equal(output.channels, 4);

    assert.equal(String(output.buffer.slice(0, 4)), '0,0,0,0');
    assert.equal(String(output.buffer.slice(4, 8)), '167,205,228,255');
  });

  it('should color-ramp a uint8', async () => {
    const bytes: DecompressedInterleaved = {
      buffer: new Uint8Array([0, 128, 255]),
      depth: 'uint8',
      channels: 1,
      width: 3,
      height: 1,
    };

    const output = await PipelineColorRamp.process(FakeComp, bytes);

    assert.equal(output.channels, 4);

    assert.equal(String(output.buffer.slice(0, 4)), '0,0,0,255');
    assert.equal(String(output.buffer.slice(4, 8)), '128,128,128,255');
    assert.equal(String(output.buffer.slice(8, 12)), '255,255,255,255');
  });

  it('should color-ramp a uint32', async () => {
    const bytes: DecompressedInterleaved = {
      buffer: new Uint32Array([0, 2 ** 31, 2 ** 32 - 1]),
      depth: 'uint32',
      channels: 1,
      width: 3,
      height: 1,
    };

    const output = await PipelineColorRamp.process(FakeComp, bytes);

    assert.equal(output.channels, 4);

    assert.equal(String(output.buffer.slice(0, 4)), '0,0,0,255');
    assert.equal(String(output.buffer.slice(4, 8)), '128,128,128,255');
    assert.equal(String(output.buffer.slice(8, 12)), '255,255,255,255');
  });
});
