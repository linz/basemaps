export class ColorRamp {
  noData: { v: number; color: [number, number, number, number] };
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
    if (num === this.noData.v) return this.noData.color;

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

// Stolen from https://github.com/andrewharvey/srtm-stylesheets/blob/master/stylesheets/color-ramps/srtm-Australia-color-ramp.gdaldem.txt
export const ramp = new ColorRamp(
  `nv 0 0 0 0
-8764 0 0 0 255
-4000 3 45 85 255
-100 0 101 199 255
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
