import { ComputeContext } from './compute.function.js';

export const TerrainRgb = {
  process(ctx: ComputeContext): ComputeContext {
    const raw = new Uint8ClampedArray(ctx.width * ctx.height * 4);
    /** mapbox values */
    const base = -10_000;
    const interval = 0.1;

    const f32Array = new Float32Array(ctx.data.buffer);

    let outputOffset = -4;
    for (let i = 0; i < f32Array.length; i += ctx.channels) {
      outputOffset += 4;
      if (ctx.channels === 4) {
        const alpha = f32Array[i + 3];
        if (alpha === 0) continue;
      }
      const px = f32Array[i];
      const v = (px - base) / interval;
      raw[outputOffset + 0] = Math.floor(v / 256 / 256) % 256;
      raw[outputOffset + 1] = Math.floor(v / 256) % 256;
      raw[outputOffset + 2] = v % 256;
      raw[outputOffset + 3] = 255;
    }
    return { data: Buffer.from(raw), width: ctx.width, height: ctx.height, channels: 4 };
  },
};
