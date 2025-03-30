import { Colorizer } from './colorize.js';

export class ColorRamp implements Colorizer {
  min: number;
  max: number;
  ramps: { v: number; color: [number, number, number, number] }[] = [];
  constructor(ramp: string) {
    const ramps = ramp.trim().split('\n');

    for (const ramp of ramps) {
      const parts = ramp.trim().split(' ');
      const numbers = parts.map(Number);
      this.ramps.push({ v: numbers[0], color: numbers.slice(1) as [number, number, number, number] });
    }

    this.min = this.ramps[0].v;
    this.max = this.ramps[this.ramps.length - 1].v;
  }

  set(val: number, data: Uint8ClampedArray, targetOffset: number): void {
    // Value too small use the min color
    if (val <= this.min) {
      const color = this.ramps[0].color;
      data[targetOffset] = color[0];
      data[targetOffset + 1] = color[1];
      data[targetOffset + 2] = color[2];
      data[targetOffset + 3] = color[3];
      return;
      // Value too large use max color
    } else if (val >= this.max) {
      const color = this.ramps[this.ramps.length - 1].color;
      data[targetOffset] = color[0];
      data[targetOffset + 1] = color[1];
      data[targetOffset + 2] = color[2];
      data[targetOffset + 3] = color[3];
      return;
    }

    for (let i = 0; i < this.ramps.length - 1; i++) {
      const ramp = this.ramps[i];
      if (val < ramp.v) continue;
      if (ramp.v === val) {
        const color = ramp.color;
        data[targetOffset] = color[0];
        data[targetOffset + 1] = color[1];
        data[targetOffset + 2] = color[2];
        data[targetOffset + 3] = color[3];
        return;
      }

      const rampNext = this.ramps[i + 1];
      if (val >= rampNext.v) continue;

      const range = rampNext.v - ramp.v;
      const offset = val - ramp.v;
      const scale = offset / range;

      const r = Math.round((rampNext.color[0] - ramp.color[0]) * scale + ramp.color[0]);
      const g = Math.round((rampNext.color[1] - ramp.color[1]) * scale + ramp.color[1]);
      const b = Math.round((rampNext.color[2] - ramp.color[2]) * scale + ramp.color[2]);
      const a = Math.round((rampNext.color[3] - ramp.color[3]) * scale + ramp.color[3]);
      data[targetOffset] = r;
      data[targetOffset + 1] = g;
      data[targetOffset + 2] = b;
      data[targetOffset + 3] = a;
      return;
    }

    // Because min/max bounds are checked first all values should fall within min-max
    throw new Error('Ramp value assertion failure');
  }
}
