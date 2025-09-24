import { DefaultColorRamp, PipelineColorRampArgs } from '@basemaps/config';
import { CompositionTiff } from '@basemaps/tiler';

import { ColorRamp } from './colorize/color.ramp.js';
import { Colorizer } from './colorize/colorize.js';
import { GreyScale } from './colorize/grey.scale.js';
import { DecompressedInterleaved, Pipeline } from './decompressor.js';

export const Ramps: Record<DecompressedInterleaved['depth'], Colorizer> = {
  float32: new ColorRamp(DefaultColorRamp),
  uint8: new GreyScale(0, 255),
  uint16: new GreyScale(0, 2 ** 16 - 1),
  uint32: new GreyScale(0, 2 ** 32 - 1),
};

function getRamp(data: DecompressedInterleaved, ctx: PipelineColorRampArgs): Colorizer {
  if (ctx?.ramp != null) return new ColorRamp(ctx.ramp);
  return Ramps[data.depth];
}

export const PipelineColorRamp: Pipeline<PipelineColorRampArgs> = {
  type: 'color-ramp',
  process(comp: CompositionTiff, data: DecompressedInterleaved, ctx: PipelineColorRampArgs): DecompressedInterleaved {
    const raw = new Uint8ClampedArray(data.width * data.height * 4);
    const output: DecompressedInterleaved = {
      pixels: raw,
      depth: 'uint8',
      channels: 4,
      width: data.width,
      height: data.height,
    };

    const ramp = getRamp(data, ctx);

    const size = data.width * data.height;
    const noData = comp.asset.images[0].noData;

    for (let i = 0; i < size; i++) {
      const source = i * data.channels;

      const px = data.pixels[source];

      if (noData != null && px === noData) continue;

      const target = i * 4;
      ramp.set(px, raw, target);
    }

    return output;
  },
};
