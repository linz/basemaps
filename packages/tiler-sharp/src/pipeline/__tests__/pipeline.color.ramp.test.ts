import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Tiff } from '@basemaps/shared';
import { CompositionTiff } from '@basemaps/tiler';

import { ColorRamp } from '../colorize/color.ramp.js';
import { GreyScale } from '../colorize/grey.scale.js';
import { DecompressedInterleaved } from '../decompressor.js';
import { PipelineColorRamp } from '../pipeline.color.ramp.js';

const FakeTiff = { images: [{ noData: -9999, resolution: [0.1, -0.1] }] } as unknown as Tiff;
const FakeComp = { asset: FakeTiff, source: { x: 0, y: 0, imageId: 0 } } as CompositionTiff;

describe('pipeline.color-ramp', () => {
  it('should color-ramp a float32 DEM with default ramp', async () => {
    const bytes: DecompressedInterleaved = {
      pixels: new Float32Array([-9999, 0, 100]),
      depth: 'float32',
      channels: 1,
      width: 3,
      height: 1,
    };

    const output = await PipelineColorRamp.process(FakeComp, bytes);

    assert.equal(output.channels, 4);

    assert.equal(String(output.pixels.slice(0, 4)), '0,0,0,0');
    assert.equal(String(output.pixels.slice(4, 8)), '167,205,228,255');
  });

  it('should color-ramp a uint8', async () => {
    const bytes: DecompressedInterleaved = {
      pixels: new Uint8Array([0, 128, 255]),
      depth: 'uint8',
      channels: 1,
      width: 3,
      height: 1,
    };

    const output = await PipelineColorRamp.process(FakeComp, bytes);

    assert.equal(output.channels, 4);

    assert.equal(String(output.pixels.slice(0, 4)), '0,0,0,255');
    assert.equal(String(output.pixels.slice(4, 8)), '128,128,128,255');
    assert.equal(String(output.pixels.slice(8, 12)), '255,255,255,255');
  });

  it('should create the same uint8 from greyscale:uint8 or color-ramp', () => {
    const greyRamp = new GreyScale(0, 255);
    const greyOut = new Uint8ClampedArray(4);
    const colorRamp = new ColorRamp(`0 0 0 0 255\n255 255 255 255 255`);
    const colorOut = new Uint8ClampedArray(4);

    for (let i = 0; i < 255; i++) {
      greyRamp.set(i, greyOut, 0);
      colorRamp.set(i, colorOut, 0);
      assert.deepEqual(greyOut, colorOut);
    }
  });

  it('should create the same uint8 from greyscale:uint32 or color-ramp', () => {
    const intMax = 2 ** 32 - 1;
    const greyRamp = new GreyScale(0, intMax);
    const greyOut = new Uint8ClampedArray(4);
    const colorRamp = new ColorRamp(`0 0 0 0 255\n${intMax} 255 255 255 255`);
    const colorOut = new Uint8ClampedArray(4);

    const intStep = intMax / 1_000;
    for (let i = 0; i < intMax; i += intStep) {
      greyRamp.set(i, greyOut, 0);
      colorRamp.set(i, colorOut, 0);
      assert.deepEqual(greyOut, colorOut);
    }
  });

  it('should color-ramp a uint32', async () => {
    const bytes: DecompressedInterleaved = {
      pixels: new Uint32Array([0, 2 ** 31, 2 ** 32 - 1]),
      depth: 'uint32',
      channels: 1,
      width: 3,
      height: 1,
    };

    const output = await PipelineColorRamp.process(FakeComp, bytes);

    assert.equal(output.channels, 4);

    assert.equal(String(output.pixels.slice(0, 4)), '0,0,0,255');
    assert.equal(String(output.pixels.slice(4, 8)), '128,128,128,255');
    assert.equal(String(output.pixels.slice(8, 12)), '255,255,255,255');
  });

  it('should color-ramp a uint16', async () => {
    const bytes: DecompressedInterleaved = {
      pixels: new Uint16Array([0, 2 ** 15, 2 ** 16 - 1]),
      depth: 'uint16',
      channels: 1,
      width: 3,
      height: 1,
    };

    const output = await PipelineColorRamp.process(FakeComp, bytes);

    assert.equal(output.channels, 4);

    assert.equal(String(output.pixels.slice(0, 4)), '0,0,0,255');
    assert.equal(String(output.pixels.slice(4, 8)), '128,128,128,255');
    assert.equal(String(output.pixels.slice(8, 12)), '255,255,255,255');
  });
});
