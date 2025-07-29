import { ConfigLayer, TileSetType } from '@basemaps/config';
import { TileSetConfigSchema } from '@basemaps/config-loader/build/json/parse.tile.set.js';

export const TsAerial: TileSetConfigSchema = {
  type: 'raster' as TileSetType.Raster,
  id: 'ts_aerial',
  title: 'Aerial Imagery Basemap',
  category: 'Basemaps',
  layers: [
    {
      '2193': 's3://linz-basemaps/2193/grey_2025_0.075m/01JZVMA8FPS6QJGHAR4VY968FY/',
      '3857': 's3://linz-basemaps/3857/grey_2025_0.075m/01JZVMA8FQV0MPPVBNBNZC6G3M/',
      name: 'grey-2025-0.075m',
      title: 'Grey 0.075m Urban Aerial Photos (2025) - Draft',
      category: 'Urban Aerial Photos',
      minZoom: 14,
    },
    {
      '2193': 's3://linz-basemaps/2193/upper-hutt_2025_0.075m/01K0TGPNGH1R7F8G5EYWHHSGD1/',
      '3857': 's3://linz-basemaps/3857/upper-hutt_2025_0.075m/01K0TGPNGH0C105PQTEFQG4QH6/',
      name: 'upper-hutt-2025-0.075m',
      title: 'Upper Hutt 0.075m Urban Aerial Photos (2025)',
      category: 'Urban Aerial Photos',
      minZoom: 14,
    },
    {
      '2193': 's3://linz-basemaps/2193/masterton_2025_0.075m/01K0XA50T2GFPNTG1PANZJ3R8B/',
      '3857': 's3://linz-basemaps/3857/masterton_2025_0.075m/01K0XA50T2MC43751EX6M8QDXK/',
      name: 'masterton-2025-0.075m',
      title: 'Masterton 0.075m Urban Aerial Photos (2025)',
      category: 'Urban Aerial Photos',
      minZoom: 14,
    },
  ] as ConfigLayer[],
};
