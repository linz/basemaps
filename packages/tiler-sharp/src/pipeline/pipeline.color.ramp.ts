import { DefaultColorRamp } from '@basemaps/config';
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

export const RampNdvi = new ColorRamp(`-1 200 50 50 255\n0 50 50 200 255\n1 50 200 50 255 255`);

export const PipelineColorRamp: Pipeline = {
  type: 'color-ramp',
  process(comp: CompositionTiff, data: DecompressedInterleaved): DecompressedInterleaved {
    const raw = new Uint8ClampedArray(data.width * data.height * 4);
    const output: DecompressedInterleaved = {
      pixels: raw,
      depth: 'uint8',
      channels: 4,
      width: data.width,
      height: data.height,
    };

    const ramp = Ramps[data.depth];

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
