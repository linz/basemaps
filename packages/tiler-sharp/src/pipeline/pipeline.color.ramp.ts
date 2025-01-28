import { DefaultColorRamp } from '@basemaps/config';
import { CompositionTiff } from '@basemaps/tiler';

import { DecompressedInterleaved, Pipeline } from './decompressor.js';

export class ColorRamp {
  ramps: { v: number; color: [number, number, number, number] }[] = [];
  constructor(ramp: string) {
    const ramps = ramp.trim().split('\n');

    for (const ramp of ramps) {
      const parts = ramp.trim().split(' ');
      const numbers = parts.map(Number);
      this.ramps.push({ v: numbers[0], color: numbers.slice(1) as [number, number, number, number] });
    }
  }

  get(num: number): [number, number, number, number] {
    const first = this.ramps[0];
    if (num <= first.v) return first.color;

    for (let i = 0; i < this.ramps.length - 1; i++) {
      const ramp = this.ramps[i];
      if (num < ramp.v) continue;
      if (ramp.v === num) return ramp.color;

      const rampNext = this.ramps[i + 1];
      if (num >= rampNext.v) continue;

      const range = rampNext.v - ramp.v;
      const offset = num - ramp.v;
      const scale = offset / range;

      const r = Math.round((rampNext.color[0] - ramp.color[0]) * scale + ramp.color[0]);
      const g = Math.round((rampNext.color[1] - ramp.color[1]) * scale + ramp.color[1]);
      const b = Math.round((rampNext.color[2] - ramp.color[2]) * scale + ramp.color[2]);
      const a = Math.round((rampNext.color[3] - ramp.color[3]) * scale + ramp.color[3]);

      return [r, g, b, a];
    }
    return this.ramps[this.ramps.length - 1].color;
  }
}

export const Ramps: Record<DecompressedInterleaved['depth'], ColorRamp> = {
  float32: new ColorRamp(DefaultColorRamp),
  uint8: new ColorRamp(`0 0 0 0 255\n255 255 255 255 255`),
  uint16: new ColorRamp(`0 0 0 0 255\n${2 ** 16 - 1} 255 255 255 255`),
  uint32: new ColorRamp(`0 0 0 0 255\n${2 ** 32 - 1} 255 255 255 255`),
};

export const PipelineColorRamp: Pipeline = {
  type: 'color-ramp',
  process(comp: CompositionTiff, data: DecompressedInterleaved): DecompressedInterleaved {
    const raw = new Uint8ClampedArray(data.width * data.height * 4);
    const output: DecompressedInterleaved = {
      buffer: raw,
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

      const px = data.buffer[source];

      if (noData != null && px === noData) continue;

      const target = i * 4;

      const color = ramp.get(px);

      raw[target + 0] = color[0];
      raw[target + 1] = color[1];
      raw[target + 2] = color[2];
      raw[target + 3] = color[3];
    }

    return output;
  },
};
