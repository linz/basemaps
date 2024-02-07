import { Tiff } from '@basemaps/shared';

import { DecompressedInterleaved, Pipeline } from './decompressor.js';

export const PipelineTerrainRgb: Pipeline = {
  type: 'terrain-rgb',
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

      const v = (px - base) / interval;

      const target = i * 4;
      raw[target] = (v >> 16) & 0xff; // Math.floor(v / 256 / 256) % 256;
      raw[target + 1] = (v >> 8) & 0xff; // Math.floor(v / 256) % 256;
      raw[target + 2] = v % 256;
      raw[target + 3] = 255;
    }

    return output;
  },
};
