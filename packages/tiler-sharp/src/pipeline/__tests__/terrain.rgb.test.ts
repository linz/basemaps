import assert from 'node:assert';
import { describe, it } from 'node:test';

import { GoogleTms } from '@basemaps/geo';
import { CompositionTiff } from '@basemaps/tiler';
import { Tiff, TiffImage } from '@cogeotiff/core';

import { PipelineTerrainRgb } from '../pipeline.terrain.rgb.js';

const FakeTiff = { images: [{ noData: -32627, resolution: [0.1, -0.1] }] } as unknown as Tiff;
const FakeComp = { asset: FakeTiff, source: { x: 0, y: 0, imageId: 0 } } as CompositionTiff;

function decodeTerrainRgb(buf: ArrayLike<number>, offset = 0): number {
  const r = buf[offset];
  const g = buf[offset + 1];
  const b = buf[offset + 2];

  return -10_000 + (r * 256 * 256 + g * 256 + b) * 0.1;
}

describe('TerrainRgb', () => {
  it('should encode zero', async () => {
    const output = await PipelineTerrainRgb.process(FakeComp, {
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
    const output = await PipelineTerrainRgb.process(FakeComp, {
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
    const output = await PipelineTerrainRgb.process(FakeComp, {
      pixels: new Float32Array([-32627]),
      depth: 'float32',
      width: 1,
      height: 1,
      channels: 1,
    });

    assert.equal(output.pixels[3], 0);
  });

  it('should not encode values outside the range of terrainrgb', async () => {
    const maxValue = decodeTerrainRgb([255, 255, 255, 255]);
    const minValue = decodeTerrainRgb([0, 0, 0, 255]); // -10_000
    assert.equal(minValue, -10_000);
    assert.equal(maxValue, 1667721.5);
    assert.equal(minValue, PipelineTerrainRgb.MinValue);
    assert.equal(maxValue, PipelineTerrainRgb.MaxValue);

    const output = await PipelineTerrainRgb.process(FakeComp, {
      pixels: new Float32Array([minValue, -10_001, maxValue, maxValue + 1]),
      depth: 'float32',
      width: 4,
      height: 1,
      channels: 1,
    });

    assert.equal(decodeTerrainRgb(output.pixels, 0), minValue);
    assert.equal(decodeTerrainRgb(output.pixels, 4), minValue);

    assert.equal(decodeTerrainRgb(output.pixels, 8), maxValue);
    assert.equal(decodeTerrainRgb(output.pixels, 12), maxValue);
  });

  it('should encode every possible value', async () => {
    const widthHeight = 4096;
    const pixels = new Float32Array(widthHeight * widthHeight);

    for (let i = 0; i < widthHeight * widthHeight; i++) {
      const target = -10_000 + i * 0.1;
      pixels[i] = target;
    }

    console.time('encode');
    const output = await PipelineTerrainRgb.process(FakeComp, {
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

  it('should reduce the precision when resolution is low', async () => {
    const input = {
      pixels: new Float32Array([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]),
      depth: 'float32',
      width: 11,
      height: 1,
      channels: 1,
    } as const;
    async function toTerrainRgb(resolution: number): Promise<number[]> {
      const tiff = {
        ...FakeComp,
        asset: {
          ...FakeComp.asset,
          images: [{ noData: -9999, resolution: [resolution, -resolution] } as unknown as TiffImage],
        } as Tiff,
      };

      const output = await PipelineTerrainRgb.process(tiff, input);

      const decoded: number[] = [];
      for (let i = 0; i < input.pixels.length; i++) {
        decoded.push(decodeTerrainRgb(output.pixels, i * 4));
      }
      return decoded.map((m) => Number(m.toFixed(1)));
    }

    assert.deepEqual(await toTerrainRgb(GoogleTms.pixelScale(12)), [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

    // 3 bits of reduction ~1m of resolution loss
    assert.deepEqual(
      await toTerrainRgb(GoogleTms.pixelScale(11)),
      [0, 9.6, 20, 29.6, 40, 49.6, 60, 69.6, 80, 89.6, 100],
    );

    // 4 bits of reduction ~2m of resolution loss
    assert.deepEqual(
      await toTerrainRgb(GoogleTms.pixelScale(10)),
      [0, 9.6, 19.2, 28.8, 40, 49.6, 59.2, 68.8, 80, 89.6, 99.2],
    );

    // 5 bits of reduction ~4m of resolution loss
    assert.deepEqual(
      await toTerrainRgb(GoogleTms.pixelScale(9)),
      [0, 9.6, 19.2, 28.8, 38.4, 48, 57.6, 67.2, 80, 89.6, 99.2],
    );

    // 6 bits of reduction ~8m of resolution loss
    assert.deepEqual(
      await toTerrainRgb(GoogleTms.pixelScale(8)),
      [-3.2, 9.6, 16, 28.8, 35.2, 48, 54.4, 67.2, 80, 86.4, 99.2],
    );

    // 7 bits of reduction ~16m of resolution loss
    assert.deepEqual(
      await toTerrainRgb(GoogleTms.pixelScale(7)),
      [-3.2, 9.6, 9.6, 22.4, 35.2, 48, 48, 60.8, 73.6, 86.4, 99.2],
    );

    // 8 bits of reduction ~25m of resolution loss
    assert.deepEqual(
      await toTerrainRgb(GoogleTms.pixelScale(6)),
      [-16, 9.6, 9.6, 9.6, 35.2, 35.2, 35.2, 60.8, 60.8, 86.4, 86.4],
    );
  });
});
