import { CompositionTiff } from '@basemaps/tiler';

import { DecompressedInterleaved, Pipeline } from './decompressor.js';

export const PipelineExtract: Pipeline<{ r: number; g: number; b: number }> = {
  type: 'extract',
  process(
    source: CompositionTiff,
    data: DecompressedInterleaved,
    ctx: { r: number; g: number; b: number },
  ): DecompressedInterleaved {
    const raw = new Uint8ClampedArray(data.width * data.height * 4);
    const output: DecompressedInterleaved = {
      pixels: raw,
      depth: 'uint8',
      channels: 4,
      width: data.width,
      height: data.height,
    };

    // console.log({ data });
    const size = data.width * data.height;
    const noData = source.asset.images[0].noData ?? 0;

    // const off = 0;
    // console.log('read', data.channels);
    for (let i = 0; i < size; i++) {
      const source = i * data.channels;

      const pxR = data.pixels[source + ctx.r];
      const pxG = data.pixels[source + ctx.g];
      const pxB = data.pixels[source + ctx.b];

      if (noData != null) {
        if (pxR === noData && pxG === noData && pxB === noData) continue;
        // if (pxG === noData) continue;
        // if (pxB === noData) continue;
      }

      // console.log({ pxR, pxG, pxB });

      const target = i * 4;
      raw[target] = pxR;
      raw[target + 1] = pxG;
      raw[target + 2] = pxB;
      raw[target + 3] = 255;
    }

    return output;
  },
};
