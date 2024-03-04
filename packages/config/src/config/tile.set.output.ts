import { ConfigTileSetRasterOutput } from './tile.set.js';

export const DefaultTerrainRgbOutput: ConfigTileSetRasterOutput = {
  title: 'TerrainRGB',
  name: 'terrain-rgb',
  pipeline: [{ type: 'terrain-rgb' }],
  // terrain rgb cannot be resampled after it has been made,
  // so it has to be a lossless image format
  // WebP takes a lot of compute to be lossless on the fly, so default to PNG
  format: ['png'],
  // Zero encoded as a TerrainRGB
  background: { r: 1, g: 134, b: 160, alpha: 1 },
  resizeKernel: { in: 'nearest', out: 'nearest' },
} as const;

export const DefaultColorRampOutput: ConfigTileSetRasterOutput = {
  title: 'Color ramp',
  name: 'color-ramp',
  pipeline: [{ type: 'color-ramp' }],
  background: { r: 188, g: 222, b: 254, alpha: 1 },
} as const;
