import { ComputeContext } from './compute.function.js';

export const ColorRamp = {
  process(ctx: ComputeContext): ComputeContext {
    const raw = new Uint8ClampedArray(ctx.width * ctx.height * 4);

    const f32Array = new Float32Array(ctx.data.buffer);

    let outputOffset = -4;
    for (let i = 0; i < f32Array.length; i += ctx.channels) {
      outputOffset = outputOffset + 4;
      if (ctx.channels === 4) {
        const alpha = f32Array[i + 3];
        if (alpha < 1) continue;
      }

      const px = f32Array[i];

      const color = ramp.get(px);

      raw[outputOffset + 0] = color[0];
      raw[outputOffset + 1] = color[1];
      raw[outputOffset + 2] = color[2];
      raw[outputOffset + 3] = color[3];
    }
    return { data: Buffer.from(raw), width: ctx.width, height: ctx.height, channels: 4 };
  },
};

export class ColorRamper {
  noData?: { v: number; color: [number, number, number, number] };
  ramps: { v: number; color: [number, number, number, number] }[] = [];
  constructor(ramp: string, noDataValue: number) {
    const ramps = ramp.split('\n');

    for (const ramp of ramps) {
      const parts = ramp.trim().split(' ');
      if (parts[0] === 'nv') {
        this.noData = { v: noDataValue, color: parts.slice(1).map(Number) as [number, number, number, number] };
        continue;
      }
      const numbers = parts.map(Number);
      this.ramps.push({ v: numbers[0], color: numbers.slice(1) as [number, number, number, number] });
    }
  }

  get(num: number): [number, number, number, number] {
    if (num === this.noData?.v) return this.noData.color;

    const first = this.ramps[0];
    if (num < first.v) return first.color;

    for (let i = 0; i < this.ramps.length - 1; i++) {
      const ramp = this.ramps[i];
      const rampNext = this.ramps[i + 1];
      if (num >= rampNext.v) continue;
      if (num < ramp.v) continue;
      if (ramp.v === num) return ramp.color;

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
export const ramp = new ColorRamper(
  `nv 0 0 0 0
  -8764 0 0 0 255
  -4000 3 45 85 255
  -10 0 101 199 255
  0 192 224 255 255
  1 108 220 108 255
  55 50 180 50 255
  390 240 250 150 255
  835 190 185 135 255
  1114 180 128 107 255
  1392 235 220 220 255
  4000 215 244 244 255
  7000 255 255 255 255`,
  -9999,
);
