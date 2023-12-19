import { ConfigTileSetComputed, TileSetType } from '../tile.set.js';

export const tileSetCompute: ConfigTileSetComputed = {
  id: 'ts_elevation',
  name: 'elevation',

  type: TileSetType.Computed,
  title: 'New Zealand Digital Earth Model',
  layers: [
    {
      3857: 's3://linz-basemaps/3857/gebco_2023-305m/',
      name: ' gebco_2023-305m',
      title: 'Gebco 2023 (305m)',
    },
  ],
  outputs: [
    {
      title: 'Terrain RGB',
      extension: 'terrain-rgb.webp',
      pipeline: [{ function: 'terrain-rgb' }],
      output: { type: 'webp', lossless: true },
    },
    {
      title: 'Terrain RGB',
      extension: 'terrain-rgb.png',
      pipeline: [{ function: 'terrain-rgb' }],
      output: { type: 'png' },
    },
    {
      title: 'Terrain RGB',
      extension: 'color-ramp.webp',
      pipeline: [{ function: 'color-ramp', ramp: ['nv 0,0,0,0'] }],
      output: { type: 'webp', level: 90 },
    },
  ],
};
