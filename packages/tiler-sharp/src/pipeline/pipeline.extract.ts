import { PipelineExtractArgs } from '@basemaps/config';
import { CompositionTiff } from '@basemaps/tiler';

import { DecompressedInterleaved, Pipeline } from './decompressor.js';

export const PipelineExtract: Pipeline<PipelineExtractArgs> = {
  type: 'extract',
  process(source: CompositionTiff, data: DecompressedInterleaved, ctx: PipelineExtractArgs): DecompressedInterleaved {
    const raw = new Uint8ClampedArray(data.width * data.height * 4);
    const output: DecompressedInterleaved = {
      pixels: raw,
      depth: 'uint8',
      channels: 4,
      width: data.width,
      height: data.height,
    };

    const size = data.width * data.height;
    const noData = source.asset.images[0].noData ?? null;

    const scaleR = ctx.scale?.r ?? 255;
    const scaleG = ctx.scale?.g ?? 255;
    const scaleB = ctx.scale?.b ?? 255;
    // const scaleAlpha = ctx.scale?.alpha ?? 255;
    console.log('output:', size, ctx);

    for (let i = 0; i < size; i++) {
      const source = i * data.channels;

      const pxR = (data.pixels[source + ctx.r] / scaleR) * 255;
      const pxG = (data.pixels[source + ctx.g] / scaleG) * 255;
      const pxB = (data.pixels[source + ctx.b] / scaleB) * 255;

      // if (i % 16 === 0) console.log(i, data.pixels.slice(source, source + 5));

      // console.log(pxR, pxG, pxB);
      // const pxAlpha = (data.pixels[source + ctx.alpha] / scaleAlpha) * 255;

      if (noData != null) {
        if (pxR === noData && pxG === noData && pxB === noData) continue;
      }

      const target = i * 4;
      raw[target] = pxR;
      raw[target + 1] = pxG;
      raw[target + 2] = pxB;
      raw[target + 3] = 255;
      // if (i > 512) break;
    }

    return output;
  },
};
