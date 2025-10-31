import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ImageryBandDataType, ImageryBandType } from '@basemaps/config';

import { findOptimialCoveringZoomOffset } from '../tile.cover.js';

const TileSize = 512;

function rawDataSize(imageryType: ImageryBandDataType): number {
  switch (imageryType) {
    case 'uint8':
      return 1;
    case 'uint16':
      return 2;
    case 'float32':
      return 4;
    default:
      throw new Error(`Unknown imagery type: ${imageryType}`);
  }
}

function rawTileSize(sourceBands: ImageryBandType[]): number {
  let size = 0;
  for (const b of sourceBands) size += rawDataSize(b.type);
  return size * TileSize * TileSize;
}

function tileCount(zoomOffset: number): number {
  let count = 0;
  for (let z = 0; z < zoomOffset; z++) {
    // z:0 - 1x1 - 1 tile
    // z:1 - 2x2 - 4 tiles
    // z:3 - 4x4 - 16 tiles
    // z:3 - 8x8 - 64 tiles
    count = count + 2 ** z * 2 ** z;
  }
  return count;
}

function estimatedCogSize(zoomOffset: number, sourceBands: ImageryBandType[]): number {
  const tileCountValue = tileCount(zoomOffset);
  const tileSizeValue = rawTileSize(sourceBands);
  return tileCountValue * tileSizeValue;
}

describe('coveringOffset', () => {
  const uint8 = { type: 'uint8' } as const;
  const float32 = { type: 'float32' } as const;
  const uint16 = { type: 'uint16' } as const;

  // TODO use these estimated sizes to determine if the covering zoom level offset is ok
  it('should calculate raw size of a 6 level cog correctly', () => {
    assert.equal(tileCount(1), 1);
    assert.equal(tileCount(2), 1 + 4);
    assert.equal(tileCount(3), 1 + 4 + 16);
    assert.equal(tileCount(4), 1 + 4 + 16 + 64);
    assert.equal(tileCount(5), 1 + 4 + 16 + 64 + 256);

    assert.equal(estimatedCogSize(1, [uint8]), 1 * 512 * 512 * 1);
    assert.equal(estimatedCogSize(1, [uint16]), 1 * 512 * 512 * 2);
    assert.equal(estimatedCogSize(1, [uint16, uint16]), 1 * 512 * 512 * 2 * 2);
    assert.equal(estimatedCogSize(1, [float32]), 1 * 512 * 512 * 4);

    rawTileSize([uint16, uint16, uint16, uint16, uint16]);
  });

  it('should cover singleband uint8 or uint16 correctly', () => {
    for (const preset of ['lerc_1mm', 'lerc_10mm', 'zstd_17'] as const) {
      assert.equal(7, findOptimialCoveringZoomOffset(preset, [uint8]));
      assert.equal(7, findOptimialCoveringZoomOffset(preset, [uint16]));
    }
  });

  it('should cover a webp rgb(a) correctly', () => {
    assert.equal(7, findOptimialCoveringZoomOffset('webp', [uint8, uint8, uint8, uint8]));
    assert.equal(7, findOptimialCoveringZoomOffset('webp', [uint8, uint8, uint8]));
  });

  it('should cover a float32 single band correctly', () => {
    assert.equal(7, findOptimialCoveringZoomOffset('lerc_1mm', [float32]));
    assert.equal(7, findOptimialCoveringZoomOffset('lerc_10mm', [float32]));
  });

  it('should reduce the size with zstd compression', () => {
    assert.equal(6, findOptimialCoveringZoomOffset('zstd_17', [float32]));
    assert.equal(6, findOptimialCoveringZoomOffset('zstd_17', [uint8, uint8, uint8]));
    assert.equal(6, findOptimialCoveringZoomOffset('zstd_17', [uint8, uint8, uint8, uint8]));

    // RGBI+Alpha
    assert.equal(6, findOptimialCoveringZoomOffset('zstd_17', [uint8, uint8, uint8, uint8, uint8]));
    assert.equal(6, findOptimialCoveringZoomOffset('zstd_17', [uint16, uint16, uint16, uint16, uint16]));
  });

  it('should default to level 6 for lzw compression', () => {
    assert.equal(6, findOptimialCoveringZoomOffset('lzw', [float32]));
    assert.equal(6, findOptimialCoveringZoomOffset('lzw', [uint8, uint8, uint8]));
    assert.equal(6, findOptimialCoveringZoomOffset('lzw', [uint8, uint8, uint8, uint8]));

    // RGBI+Alpha - these have not been tested and are assumed to be ok
    assert.equal(6, findOptimialCoveringZoomOffset('lzw', [uint8, uint8, uint8, uint8, uint8]));
    assert.equal(6, findOptimialCoveringZoomOffset('lzw', [uint16, uint16, uint16, uint16, uint16]));
  });
});
