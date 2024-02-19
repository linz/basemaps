import { ConfigTileSetRasterOutput } from './tile.set.js';

export const DefaultTerrainRgbOutput: ConfigTileSetRasterOutput = {
  title: 'TerrainRGB',
  name: 'terrain-rgb',
  pipeline: [{ type: 'terrain-rgb' }],
  output: {
    // terrain rgb cannot be resampled after it has been made
    lossless: true,
    // Zero encoded as a TerrainRGB
    background: { r: 1, g: 134, b: 160, alpha: 1 },
    resizeKernel: { in: 'nearest', out: 'nearest' },
  },
} as const;

export const DefaultColorRampOutput: ConfigTileSetRasterOutput = {
  title: 'Color ramp',
  name: 'color-ramp',
  pipeline: [{ type: 'color-ramp' }],
  output: {
    background: { r: 1, g: 134, b: 160, alpha: 1 },
  },
} as const;
