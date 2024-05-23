import { Tiff } from '@cogeotiff/core';

import { DecompressedInterleaved, Pipeline } from './decompressor.js';

const MinValue = -10_000;
const MaxValue = 1_667_721.5;
export interface TerrainRgbRange {
  /** Minimum value that can be encoded */
  MinValue: -10_000;
  /** Maximum value that can be encoded */
  MaxValue: 1_667_721.5;
}

export const PipelineTerrainRgb: Pipeline & TerrainRgbRange = {
  type: 'terrain-rgb',
  MinValue,
  MaxValue,
  process(source: Tiff, data: DecompressedInterleaved): DecompressedInterleaved {
    const raw = new Uint8ClampedArray(data.width * data.height * 4);
    const output: DecompressedInterleaved = {
      pixels: raw,
      depth: 'uint8',
      channels: 4,
      width: data.width,
      height: data.height,
    };

    const size = data.width * data.height;
    const noData = source.images[0].noData;
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

      raw[target] = (v >> 16) & 0xff; // Math.floor(v / 256 / 256) % 256;
      raw[target + 1] = (v >> 8) & 0xff; // Math.floor(v / 256) % 256;
      raw[target + 2] = v % 256;
      raw[target + 3] = 255;
    }

    return output;
  },
};
