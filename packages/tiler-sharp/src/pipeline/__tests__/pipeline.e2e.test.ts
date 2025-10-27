import assert from 'node:assert';
import { describe, it } from 'node:test';

import { GoogleTms, Tile } from '@basemaps/geo';
import { fsa } from '@basemaps/shared';
import { TestTiff } from '@basemaps/test';
import { CompositionTiff, Tiler } from '@basemaps/tiler';
import { Tiff } from '@cogeotiff/core';
import { readFileSync, writeFileSync } from 'fs';
import PixelMatch from 'pixelmatch';
import { PNG } from 'pngjs';

import { TileMakerSharp } from '../../index.js';

const tileSize = 256;
const WriteImages = false;

function assertTiffBuffer(buffer: Buffer, tile: Tile, pipeline: string): void {
  const newImage = PNG.sync.read(buffer);
  if (WriteImages) {
    const fileName = getExpectedTileName(tile, pipeline);
    writeFileSync(fileName, buffer);
  }

  const oldImage = getExpectedTile(tile, pipeline);

  const missMatchedPixels = PixelMatch(oldImage.data, newImage.data, null, tileSize, tileSize);
  if (missMatchedPixels > 0) {
    const fileName = getExpectedTileName(tile, pipeline, true);
    const output = new PNG({ width: tileSize, height: tileSize });
    PixelMatch(oldImage.data, newImage.data, output.data, tileSize, tileSize);
    writeFileSync(fileName, PNG.sync.write(output));
  }
  assert.equal(missMatchedPixels, 0);
}

function getExpectedTile(tile: Tile, pipeline: string): PNG {
  const url = getExpectedTileName(tile, pipeline);
  const bytes = readFileSync(url);
  return PNG.sync.read(bytes);
}

function getExpectedTileName(tile: Tile, pipeline: string, diff = false): URL {
  return new URL(
    `../../../static/expected_tile_3857_256x256_${tile.x}_${tile.y}_z${tile.z}-${pipeline}${diff ? '-diff' : ''}.png`,
    import.meta.url,
  );
}

describe('pipeline.e2e', () => {
  const tileRgbi16 = { x: 262144, y: 262144, z: 19 };

  const tileMaker = new TileMakerSharp(tileSize);
  const tiler = new Tiler(GoogleTms);

  it('should create a rgb tiff', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Rgbi16));

    const layers = tiler.tile([tiff], tileRgbi16.x, tileRgbi16.y, tileRgbi16.z) as CompositionTiff[];

    const png = await tileMaker.compose({
      layers,
      format: 'png',
      background: { r: 255, g: 0, b: 255, alpha: 0.3 },
      pipeline: [{ type: 'extract', r: 0, g: 1, b: 2, alpha: 3 }],
      resizeKernel: { in: 'nearest', out: 'nearest' },
    });
    assertTiffBuffer(png.buffer, tileRgbi16, 'rgb');
    await tiff.source.close?.();
  });

  it('should create a false-color', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Rgbi16));

    const layers = tiler.tile([tiff], tileRgbi16.x, tileRgbi16.y, tileRgbi16.z) as CompositionTiff[];

    const png = await tileMaker.compose({
      layers,
      format: 'png',
      background: { r: 255, g: 0, b: 255, alpha: 0.3 },
      pipeline: [{ type: 'extract', r: 2, g: 1, b: 0, alpha: 3 }],
      resizeKernel: { in: 'nearest', out: 'nearest' },
    });

    assertTiffBuffer(png.buffer, tileRgbi16, 'false-color');
    await tiff.source.close?.();
  });

  it('should create a scaled ndvi', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Rgbi16));

    const layers = tiler.tile([tiff], tileRgbi16.x, tileRgbi16.y, tileRgbi16.z) as CompositionTiff[];

    const png = await tileMaker.compose({
      layers,
      format: 'png',
      background: { r: 255, g: 0, b: 255, alpha: 0.3 },
      pipeline: [{ type: 'ndvi', r: 0, nir: 3, alpha: 3, scale: { r: 1024, nir: 1024, alpha: 255 } }],
      resizeKernel: { in: 'nearest', out: 'nearest' },
    });

    assertTiffBuffer(png.buffer, tileRgbi16, 'ndvi');
    await tiff.source.close?.();
  });

  it('should create a color ramp', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Float32Dem));

    const layers = tiler.tile([tiff], 0, 0, 0) as CompositionTiff[];

    const png = await tileMaker.compose({
      layers,
      format: 'png',
      background: { r: 255, g: 0, b: 255, alpha: 0.3 },
      pipeline: [{ type: 'color-ramp' }],
      resizeKernel: { in: 'nearest', out: 'nearest' },
    });

    assertTiffBuffer(png.buffer, { x: 0, y: 0, z: 0 }, 'color-ramp');
    await tiff.source.close?.();
  });

  it('should create a terrain-rgb', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Float32Dem));

    const layers = tiler.tile([tiff], 0, 0, 0) as CompositionTiff[];

    const png = await tileMaker.compose({
      layers,
      format: 'png',
      background: { r: 255, g: 0, b: 255, alpha: 0.3 },
      pipeline: [{ type: 'terrain-rgb' }],
      resizeKernel: { in: 'nearest', out: 'nearest' },
    });

    assertTiffBuffer(png.buffer, { x: 0, y: 0, z: 0 }, 'terrain-rgb');
    await tiff.source.close?.();
  });

  it('should create a custom color-ramp', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Float32Dem));

    const layers = tiler.tile([tiff], 0, 0, 0) as CompositionTiff[];

    const png = await tileMaker.compose({
      layers,
      format: 'png',
      background: { r: 255, g: 0, b: 255, alpha: 0.3 },
      pipeline: [{ type: 'color-ramp', ramp: '0 128 128 255 255\n255 128 255 128 255' }],
      resizeKernel: { in: 'nearest', out: 'nearest' },
    });

    assertTiffBuffer(png.buffer, { x: 0, y: 0, z: 0 }, 'color-ramp-custom');
    await tiff.source.close?.();
  });

  it('should render a big endian tiff', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Rgbi16Be));
    const tiler = new Tiler(GoogleTms);

    const layer0 = tiler.tile([tiff], 262144, 262144, 19) as CompositionTiff[];
    const tileMaker = new TileMakerSharp(256);

    const png = await tileMaker.compose({
      layers: layer0,
      format: 'png',
      background: { r: 255, g: 0, b: 255, alpha: 0.3 },
      pipeline: [{ type: 'extract', r: 0, g: 1, b: 2, alpha: 3 }],
      resizeKernel: { in: 'nearest', out: 'nearest' },
    });

    assertTiffBuffer(png.buffer, { x: 0, y: 0, z: 0 }, 'big-endian');
    await tiff.source.close?.();
  });
});
