import { Colorizer } from './colorize.js';

/**
 * Convert a number between min and max into a RGBA between 0 and 255
 */
export class GreyScale implements Colorizer {
  min: number;
  max: number;

  constructor(minVal: number, maxVal: number) {
    this.min = minVal;
    this.max = maxVal;
  }

  set(val: number, data: Uint8ClampedArray, targetOffset: number): void {
    const scaledValue = ((val - this.min) * 255) / (this.max - this.min);

    data[targetOffset] = scaledValue;
    data[targetOffset + 1] = scaledValue;
    data[targetOffset + 2] = scaledValue;
    data[targetOffset + 3] = 255;
  }
}
