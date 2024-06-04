import { CompositionTiff } from '@basemaps/tiler';

import { DecompressedInterleaved, Pipeline } from './decompressor.js';

const MinValue = -10_000;
const MaxValue = 1_667_721.5;

export interface TerrainRgbRange {
  /** Minimum value that can be encoded */
  MinValue: -10_000;
  /** Maximum value that can be encoded */
  MaxValue: 1_667_721.5;
}

/**
 * Pre defined bit masks for Red green and blue channels with the number least significant bits removed
 */
const Masks = {
  Bits9: { r: 0b11111111, g: 0b11111110, b: 0b00000000 },
  Bits8: { r: 0b11111111, g: 0b11111111, b: 0b00000000 },
  Bits7: { r: 0b11111111, g: 0b11111111, b: 0b10000000 },
  Bits6: { r: 0b11111111, g: 0b11111111, b: 0b11000000 },
  Bits5: { r: 0b11111111, g: 0b11111111, b: 0b11100000 },
  Bits4: { r: 0b11111111, g: 0b11111111, b: 0b11110000 },
  Bits3: { r: 0b11111111, g: 0b11111111, b: 0b11111000 },
  Bits2: { r: 0b11111111, g: 0b11111111, b: 0b11111100 },
  Bits1: { r: 0b11111111, g: 0b11111111, b: 0b11111110 },
  Bits0: { r: 0b11111111, g: 0b11111111, b: 0b11111111 },
};

/**
 * To reduce the output file size down reduce the accuracy of the tile as the resolution gets larger
 *
 * By reducing the number of bits in use in the RGB it can greatly increase the compression ration of the output PNG
 *
 * Each bit removed doubles the resolution loss, when each output pixel is 1,000+M ~20 metres or resolution loss is not significant
 *
 * 9Bits ~ 50M of resolution loss
 * 8Bits ~ 25.6M of resolution loss
 *
 * For a sample Z10 tile this almost halves the file size from 7804 bytes to 4619 bytes
 */
export function getResolutionMask(resolution: number): { r: number; g: number; b: number } {
  // Anything between z0 to ~z5 should be limited to 9bits
  if (resolution > 4_000) return Masks.Bits9;
  // Approx z6
  if (resolution > 2_000) return Masks.Bits8;
  // Approx z7
  if (resolution > 1_000) return Masks.Bits7;
  // Approx z8
  if (resolution > 600) return Masks.Bits6;
  // Approx z9
  if (resolution > 300) return Masks.Bits5;
  // Approx z10
  if (resolution > 150) return Masks.Bits4;
  // Approx z11
  if (resolution > 75) return Masks.Bits3;

  // full resolution
  return Masks.Bits0;
}

export const PipelineTerrainRgb: Pipeline & TerrainRgbRange = {
  type: 'terrain-rgb',
  MinValue,
  MaxValue,
  process(source: CompositionTiff, data: DecompressedInterleaved): DecompressedInterleaved {
    const raw = new Uint8ClampedArray(data.width * data.height * 4);
    const output: DecompressedInterleaved = {
      pixels: raw,
      depth: 'uint8',
      channels: 4,
      width: data.width,
      height: data.height,
    };

    // Determine the resolution that the terrain RGB will be displayed as
    const sourceImage = source.asset.images[source.source.imageId];
    const targetResolution = sourceImage.resolution[0] * (1 / (source.resize?.scale ?? 1));

    // Reduce the precision of the terrain RGB
    const clamps = getResolutionMask(targetResolution);
    const clampR = clamps.r;
    const clampG = clamps.g;
    const clampB = clamps.b;

    const size = data.width * data.height;
    const noData = source.asset.images[0].noData;
    const base = -10_000;
    const interval = 0.1;

    for (let i = 0; i < size; i++) {
      const source = i * data.channels;

      const px = data.pixels[source];

      if (noData != null && px === noData) continue;

      const target = i * 4;

      // If the value is below the minimum value, set it to 0,0,0,255 (RGBA)
      if (px <= MinValue) {
        raw[target + 3] = 255;
        continue;
      }

      // If the value is above the max value clamp it to 255,255,255,255 (RGBA)
      if (px >= MaxValue) {
        raw[target] = 255;
        raw[target + 1] = 255;
        raw[target + 2] = 255;
        raw[target + 3] = 255;
        continue;
      }

      const v = (px - base) / interval;

      raw[target] = (v >> 16) & clampR;
      raw[target + 1] = (v >> 8) & clampG;
      raw[target + 2] = v % 256 & clampB;
      raw[target + 3] = 255;
    }

    return output;
  },
};
