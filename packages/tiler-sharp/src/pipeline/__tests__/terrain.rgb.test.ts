import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Tiff } from '@cogeotiff/core';

import { PipelineTerrainRgb } from '../pipeline.terrain.rgb.js';

const FakeTiff = { images: [{ noData: -32627 }] } as unknown as Tiff;

function decodeTerrainRgb(buf: ArrayLike<number>, offset = 0): number {
  const r = buf[offset];
  const g = buf[offset + 1];
  const b = buf[offset + 2];

  return -10_000 + (r * 256 * 256 + g * 256 + b) * 0.1;
}

describe('TerrainRgb', () => {
  it('should encode zero', async () => {
    const output = await PipelineTerrainRgb.process(FakeTiff, {
      pixels: new Float32Array([0, 1, 2, 3]),
      depth: 'float32',
      width: 2,
      height: 2,
      channels: 1,
    });

    assert.equal(output.width, 2);
    assert.equal(output.height, 2);
    assert.equal(output.channels, 4);
    assert.equal(output.depth, 'uint8');

    // valid value should not have alpha
    assert.equal(output.pixels[3], 255);
    assert.equal(decodeTerrainRgb(output.pixels, 0), 0);
    assert.equal(decodeTerrainRgb(output.pixels, 4), 1);
    assert.equal(decodeTerrainRgb(output.pixels, 8), 2);
    assert.equal(decodeTerrainRgb(output.pixels, 12), 3);
  });

  it('should encode using the first channel', async () => {
    const output = await PipelineTerrainRgb.process(FakeTiff, {
      pixels: new Float32Array([0, 1, 2, 3, 1, 1, 2, 3, 2, 1, 2, 3, 3, 1, 2, 3]),
      depth: 'float32',
      width: 2,
      height: 2,
      channels: 4,
    });

    assert.equal(output.width, 2);
    assert.equal(output.height, 2);
    assert.equal(output.channels, 4);
    assert.equal(output.depth, 'uint8');

    // valid value should not have alpha
    assert.equal(output.pixels[3], 255);
    assert.equal(decodeTerrainRgb(output.pixels, 0), 0);
    assert.equal(decodeTerrainRgb(output.pixels, 4), 1);
    assert.equal(decodeTerrainRgb(output.pixels, 8), 2);
    assert.equal(decodeTerrainRgb(output.pixels, 12), 3);
  });

  it('should set no data as zero', async () => {
    const output = await PipelineTerrainRgb.process(FakeTiff, {
      pixels: new Float32Array([-32627]),
      depth: 'float32',
      width: 1,
      height: 1,
      channels: 1,
    });

    // valid value should not have alpha
    assert.equal(output.pixels[3], 0);
  });

  it('should encode every possible value', async () => {
    const widthHeight = 4096;
    const pixels = new Float32Array(widthHeight * widthHeight);

    for (let i = 0; i < widthHeight * widthHeight; i++) {
      const target = -10_000 + i * 0.1;
      pixels[i] = target;
    }

    console.time('encode');
    const output = await PipelineTerrainRgb.process(FakeTiff, {
      pixels,
      depth: 'float32',
      width: widthHeight,
      height: widthHeight,
      channels: 1,
    });
    console.timeEnd('encode');

    let rgbExpected = 0;
    for (let i = 0; i < output.pixels.length; i += 4) {
      const rgbOutput = output.pixels[i] * 256 * 256 + output.pixels[i + 1] * 256 + output.pixels[i + 2];
      const diff = Math.abs(rgbOutput - rgbExpected);

      // allow a 1px interval shift due to floating point rounding
      if (diff !== 0 && diff !== 1) {
        console.log(`Failed alignment at offset: ${i} value: ${decodeTerrainRgb(output.pixels, i)} diff: ${diff}`);
        assert.deepEqual(
          diff,
          0,
          `Failed alignment at offset: ${i} value: ${decodeTerrainRgb(output.pixels, i)} diff: ${diff}`,
        );
      }

      rgbExpected++;
    }
  });
});
