import { TileSetType } from '@basemaps/config';
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
  ],
} as const;

export const TsVector: TileSetConfigSchema = {
  type: 'vector' as TileSetType.Vector,
  id: 'ts_topographic-v2',
  title: 'New Zealand Topographic Vector Map',
  maxZoom: 15,
  format: 'pbf',
  layers: [
    {
      '2193': 's3://linz-basemaps/vector/2193/topographic/01K07MGSVMXKP39SVR4RF63NQ4/topographic-v2.tar.co',
      '3857': 's3://linz-basemaps/vector/3857/topographic/01K07MN7NQR1WTBS5W9VW49EW2/topographic-v2.tar.co',
      name: 'topographic-v2',
      title: 'Topographic V2',
    },
  ],
};

export const TsIndividual: TileSetConfigSchema = {
  type: 'raster' as TileSetType.Raster,
  id: 'ts_top-of-the-south-flood-2022-0.15m',
  title: 'Top of the South Flood 0.15m Aerial Photos (2022)',
  category: 'Event',
  layers: [
    {
      '2193': 's3://linz-basemaps/2193/top-of-the-south_flood_2022_0.15m/01GGDTRTDV2BA47P4TQ6CGWMFR/',
      '3857': 's3://linz-basemaps/3857/top-of-the-south_flood_2022_0.15m/01GGDTSGRK0Z4C70WXBYMEXK4X/',
      name: 'top-of-the-south-flood-2022-0.15m',
      title: 'Top of the South Flood 0.15m Aerial Photos (2022)',
      category: 'Event',
      minZoom: 0,
      maxZoom: 32,
    },
  ],
};

export const TsElevation: TileSetConfigSchema = {
  id: 'ts_elevation',
  type: 'raster' as TileSetType.Raster,
  description: 'Elevation Basemap',
  title: 'Elevation',
  category: 'Elevation',
  layers: [
    {
      '2193': 's3://nz-elevation/new-zealand/new-zealand-contour/dem_8m/2193/',
      '3857': 's3://linz-basemaps/elevation/3857/new-zealand_2012_dem_8m/01HZ0YNQPGH5RJ01S5R5T2VAPM/',
      title: 'New Zealand 8m DEM (2012)',
      name: 'new-zealand_2012_dem_8m',
    },
    {
      '2193': 's3://nz-elevation/wellington/wellington_2013-2014/dem_1m/2193/',
      '3857': 's3://linz-basemaps/elevation/3857/wellington_2013-2014_dem_1m/01HZ67MBQJ8VASM6Z69PMATPHH/',
      minZoom: 9,
      title: 'Wellington LiDAR 1m DEM (2013-2014)',
      name: 'wellington_2013-2014_dem_1m',
    },
    {
      '2193': 's3://nz-elevation/manawatu-whanganui/manawatu-whanganui_2015-2016/dem_1m/2193/',
      '3857': 's3://linz-basemaps/elevation/3857/manawatu-whanganui_2015-2016_dem_1m/01HZ65XSK73Z8GBSTWJ6SKYGGV/',
      minZoom: 9,
      title: 'Manawatū-Whanganui LiDAR 1m DEM (2015-2016)',
      name: 'manawatu-whanganui_2015-2016_dem_1m',
    },
  ],
  outputs: [
    {
      title: 'Terrain RGB',
      name: 'terrain-rgb',
      pipeline: [{ type: 'terrain-rgb' }],
      format: ['png'],
      background: { r: 1, g: 134, b: 160, alpha: 1 },
      resizeKernel: { in: 'nearest', out: 'nearest' },
    },
    {
      title: 'Color ramp',
      name: 'color-ramp',
      pipeline: [{ type: 'color-ramp' }],
      background: { r: 172, g: 204, b: 226, alpha: 1 },
    },
  ],
};
