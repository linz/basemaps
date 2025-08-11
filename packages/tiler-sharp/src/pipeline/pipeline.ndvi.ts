import { PipelineNdviArgs } from '@basemaps/config';
import { CompositionTiff } from '@basemaps/tiler';

import { DecompressedInterleaved, Pipeline } from './decompressor.js';

// Stolen from https://custom-scripts.sentinel-hub.com/landsat-4-5-tm/ndvi/
export function colorNdvi(val: number): [number, number, number] {
  if (val < -1.1) return [0, 0, 0];
  if (val < -0.2) return [0.75, 0.75, 0.75];
  if (val < -0.1) return [0.86, 0.86, 0.86];
  if (val < 0) return [1, 1, 0.88];
  if (val < 0.025) return [1, 0.98, 0.8];
  if (val < 0.05) return [0.93, 0.91, 0.71];
  if (val < 0.075) return [0.87, 0.85, 0.61];
  if (val < 0.1) return [0.8, 0.78, 0.51];
  if (val < 0.125) return [0.74, 0.72, 0.42];
  if (val < 0.15) return [0.69, 0.76, 0.38];
  if (val < 0.175) return [0.64, 0.8, 0.35];
  if (val < 0.2) return [0.57, 0.75, 0.32];
  if (val < 0.25) return [0.5, 0.7, 0.28];
  if (val < 0.3) return [0.44, 0.64, 0.25];
  if (val < 0.35) return [0.38, 0.59, 0.21];
  if (val < 0.4) return [0.31, 0.54, 0.18];
  if (val < 0.45) return [0.25, 0.49, 0.14];
  if (val < 0.5) return [0.19, 0.43, 0.11];
  if (val < 0.55) return [0.13, 0.38, 0.07];
  if (val < 0.6) return [0.06, 0.33, 0.04];
  return [0, 0.27, 0];
}

export const PipelineNdvi: Pipeline<PipelineNdviArgs> = {
  type: 'ndvi',
  process(source: CompositionTiff, data: DecompressedInterleaved, ctx: PipelineNdviArgs): DecompressedInterleaved {
    const raw = new Uint8ClampedArray(data.width * data.height * 4);
    const output: DecompressedInterleaved = {
      pixels: raw,
      depth: 'uint8',
      channels: 4,
      width: data.width,
      height: data.height,
    };

    const scaleR = ctx.scale?.r ?? 255;
    const scaleNir = ctx.scale?.nir ?? 255;
    const scaleAlpha = ctx.scale?.alpha ?? 255;
    // console.log(ctx);

    const size = data.width * data.height;
    const noData = source.asset.images[0].noData ?? null;

    for (let i = 0; i < size; i++) {
      const source = i * data.channels;

      const pxR = (data.pixels[source + ctx.r] / scaleR) * 255;
      const pxNir = (data.pixels[source + ctx.nir] / scaleNir) * 255;
      const pxAlpha = (data.pixels[source + ctx.alpha] / scaleAlpha) * 255;
      if (noData != null) {
        if (pxR === noData || pxNir === noData) continue;
      }

      const ndvi = (pxNir - pxR) / (pxNir + pxR);
      if (isNaN(ndvi)) continue;

      const target = i * 4;

      const px = colorNdvi(ndvi);

      raw[target] = px[0] * 255;
      raw[target + 1] = px[1] * 255;
      raw[target + 2] = px[2] * 255;
      raw[target + 3] = pxAlpha;
    }

    return output;
  },
};
