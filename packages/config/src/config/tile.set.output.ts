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
  // Taken from 0 of DefaultColorRamp
  background: { r: 172, g: 204, b: 226, alpha: 1 },
} as const;

export const DefaultColorRamp = `-8764 0 0 0 255
-4000 3 45 85 255
-100 0 101 199 255 
-3 167 205 228 255
0 167 205 228 255
10 245 234 163 255
20 236 232 157 255
30 227 229 150 255
40 218 227 144 255
50 209 225 138 255
75 174 215 112 255
100 147 208 93 255
150 69 179 53 255
200 21 151 47 255
250 18 130 63 255
300 81 144 58 255
350 132 158 47 255
400 181 171 35 255
450 233 181 17 255
500 235 149 2 255
550 209 97 2 255
600 177 54 2 255
700 148 20 1 255
800 124 6 1 255
900 117 21 4 255
1000 113 30 6 255
1100 109 39 9 255
1200 106 45 12 255
1300 117 64 30 255
1400 133 88 60 255
1500 149 113 93 255
1600 162 144 135 255
1700 173 173 172 255
1800 190 190 190 255
2000 197 196 197 255
2200 203 203 203 255
2400 207 206 207 255
2800 210 209 210 255
3200 214 212 214 255
3600 217 215 217 255
4000 220 219 220 255
4400 224 222 224 255
4800 227 225 227 255`;
