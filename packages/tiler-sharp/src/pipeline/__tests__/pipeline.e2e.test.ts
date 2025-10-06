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
const WRITE_IMAGES = false;

describe('pipeline.e2e', () => {
  const tile = { x: 262144, y: 262144, z: 19 };
  const tileSize = 256;

  it('should create a rgb tiff', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Rgbi16));
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

    const newImage = PNG.sync.read(png.buffer);
    if (WRITE_IMAGES) {
      const fileName = getExpectedTileName(tile, 'rgb');
      writeFileSync(fileName, png.buffer);
    }

    const oldImage = getExpectedTile(tile, 'rgb');

    const missMatchedPixels = PixelMatch(oldImage.data, newImage.data, null, tileSize, tileSize);
    if (missMatchedPixels > 0) {
      const fileName = getExpectedTileName(tile, 'rgb', true);
      const output = new PNG({ width: tileSize, height: tileSize });
      PixelMatch(oldImage.data, newImage.data, output.data, tileSize, tileSize);
      writeFileSync(fileName, PNG.sync.write(output));
    }
    assert.equal(missMatchedPixels, 0);
    await tiff.source.close?.();
  });

  it('should create a false-color', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Rgbi16));
    const tiler = new Tiler(GoogleTms);

    const layer0 = tiler.tile([tiff], 262144, 262144, 19) as CompositionTiff[];
    const tileMaker = new TileMakerSharp(256);

    const png = await tileMaker.compose({
      layers: layer0,
      format: 'png',
      background: { r: 255, g: 0, b: 255, alpha: 0.3 },
      pipeline: [{ type: 'extract', r: 2, g: 1, b: 0, alpha: 3 }],
      resizeKernel: { in: 'nearest', out: 'nearest' },
    });

    const newImage = PNG.sync.read(png.buffer);
    if (WRITE_IMAGES) {
      const fileName = getExpectedTileName(tile, 'false-color');
      writeFileSync(fileName, png.buffer);
    }

    const oldImage = getExpectedTile(tile, 'false-color');

    const missMatchedPixels = PixelMatch(oldImage.data, newImage.data, null, tileSize, tileSize);
    if (missMatchedPixels > 0) {
      const fileName = getExpectedTileName(tile, 'false-color', true);
      const output = new PNG({ width: tileSize, height: tileSize });
      PixelMatch(oldImage.data, newImage.data, output.data, tileSize, tileSize);
      writeFileSync(fileName, PNG.sync.write(output));
    }
    assert.equal(missMatchedPixels, 0);
    await tiff.source.close?.();
  });

  it('should create a scaled ndvi', async () => {
    const tiff = await Tiff.create(fsa.source(TestTiff.Rgbi16));
    const tiler = new Tiler(GoogleTms);

    const layer0 = tiler.tile([tiff], 262144, 262144, 19) as CompositionTiff[];
    const tileMaker = new TileMakerSharp(256);

    const png = await tileMaker.compose({
      layers: layer0,
      format: 'png',
      background: { r: 255, g: 0, b: 255, alpha: 0.3 },
      pipeline: [{ type: 'ndvi', r: 0, nir: 3, alpha: 3, scale: { r: 1024, nir: 1024, alpha: 255 } }],
      resizeKernel: { in: 'nearest', out: 'nearest' },
    });

    const newImage = PNG.sync.read(png.buffer);
    if (WRITE_IMAGES) {
      const fileName = getExpectedTileName(tile, 'ndvi');
      writeFileSync(fileName, png.buffer);
    }

    const oldImage = getExpectedTile(tile, 'ndvi');

    const missMatchedPixels = PixelMatch(oldImage.data, newImage.data, null, tileSize, tileSize);
    if (missMatchedPixels > 0) {
      const fileName = getExpectedTileName(tile, 'ndvi', true);
      const output = new PNG({ width: tileSize, height: tileSize });
      PixelMatch(oldImage.data, newImage.data, output.data, tileSize, tileSize);
      writeFileSync(fileName, PNG.sync.write(output));
    }
    assert.equal(missMatchedPixels, 0);
    await tiff.source.close?.();
  });
});
