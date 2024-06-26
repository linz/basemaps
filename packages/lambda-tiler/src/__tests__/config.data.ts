import {
  base58,
  BaseConfig,
  ConfigImagery,
  ConfigProvider,
  ConfigProviderMemory,
  ConfigTileSetRaster,
  ConfigTileSetVector,
  DefaultColorRampOutput,
  DefaultTerrainRgbOutput,
  TileSetType,
} from '@basemaps/config';
import { fsa, FsMemory } from '@basemaps/shared';

export const TileSetAerial: ConfigTileSetRaster = {
  id: 'ts_aerial',
  name: 'aerial',
  type: TileSetType.Raster,
  description: 'aerial__description',
  title: 'Aerial Imagery',
  category: 'Basemap',
  layers: [
    {
      2193: 'im_01FYWKAJ86W9P7RWM1VB62KD0H',
      3857: 'im_01FYWKATAEK2ZTJQ2PX44Y0XNT',
      title: 'Ōtorohanga 0.1m Urban Aerial Photos (2021)',
      category: 'Urban Aerial Photos',
      name: 'ōtorohanga_urban_2021_0-1m_RGB',
    },
  ],
};

export const TileSetVector: ConfigTileSetVector = {
  id: 'ts_topographic',
  type: TileSetType.Vector,
  name: 'topotgrpahic',
  description: 'topotgrpahic__description',
  title: 'topotgrpahic Imagery',
  category: 'Basemap',
  layers: [
    {
      3857: 's3://linz-basemaps/01G7WQMGHB7V946M0YWJJBZ6DW/topopgraphic.tar.co',
      title: 'Vector tiles',
      category: 'Vector Tiles',
      name: 'Vector tiles',
    },
  ],
};
export const TileSetElevation: ConfigTileSetRaster = {
  id: 'ts_elevation',
  name: 'elevation',
  type: TileSetType.Raster,
  description: 'elevation__description',
  title: 'Elevation Imagery',
  category: 'Elevation',
  layers: [
    {
      2193: 'im_01FYWKAJ86W9P7RWM1VB62KD0H',
      3857: 'im_01FYWKATAEK2ZTJQ2PX44Y0XNT',
      title: 'New Zealand 8m DEM (2012)',
      name: 'new-zealand_2012_dem_8m',
    },
  ],
  outputs: [DefaultTerrainRgbOutput, DefaultColorRampOutput],
};

export const Imagery2193: ConfigImagery = {
  id: 'im_01FYWKAJ86W9P7RWM1VB62KD0H',
  name: 'ōtorohanga_urban_2021_0-1m_RGB',
  title: 'Ōtorohanga 0.1m Urban Aerial Photos (2021)',
  category: 'Urban Aerial Photos',
  projection: 2193,
  tileMatrix: 'NZTM2000Quad',
  uri: 's3://linz-basemaps/2193/ōtorohanga_urban_2021_0-1m_RGB/01FYWKAJ86W9P7RWM1VB62KD0H',
  bounds: {
    x: 1757351.3044652338,
    y: 5766358.996410044,
    width: 40970.247160854284,
    height: 26905.833956381306,
  },
  files: [],
};
export const Imagery3857: ConfigImagery = {
  id: 'im_01FYWKATAEK2ZTJQ2PX44Y0XNT',
  name: 'ōtorohanga_urban_2021_0-1m_RGB',
  title: 'Ōtorohanga 0.1m Urban Aerial Photos (2021)',
  category: 'Urban Aerial Photos',
  projection: 3857,
  tileMatrix: 'WebMercatorQuad',
  uri: 's3://linz-basemaps/3857/ōtorohanga_urban_2021_0-1m_RGB/01FYWKATAEK2ZTJQ2PX44Y0XNT',
  bounds: {
    x: 19457809.920274343,
    y: -4609458.55370921,
    width: 51977.179234057665,
    height: 30574.81131407339,
  },
  files: [
    {
      x: 19461478.89763212,
      y: -4591419.415033963,
      width: 305.7481131407044,
      height: 305.7481131407044,
      name: '17-129188-80552',
    },
    {
      x: 19502754.89290612,
      y: -4603343.591446448,
      width: 305.7481131407044,
      height: 305.7481131407044,
      name: '17-129323-80591',
    },
    {
      x: 19504283.633471873,
      y: -4608847.057483015,
      width: 611.4962262814096,
      height: 611.4962262814096,
      name: '16-64664-40304',
    },
    {
      x: 19509175.60328212,
      y: -4605178.080125325,
      width: 611.4962262814096,
      height: 611.4962262814096,
      name: '16-64672-40298',
    },
    {
      x: 19509175.60328212,
      y: -4604566.583899044,
      width: 611.4962262814096,
      height: 611.4962262814096,
      name: '16-64672-40297',
    },
    {
      x: 19459032.912726905,
      y: -4582552.719752827,
      width: 1222.9924525628148,
      height: 1222.9924525628148,
      name: '15-32295-20130',
    },
    {
      x: 19460255.905179467,
      y: -4592336.659373329,
      width: 1222.9924525628148,
      height: 1222.9924525628148,
      name: '15-32296-20138',
    },
    {
      x: 19501837.648566607,
      y: -4609458.55370921,
      width: 1222.9924525628148,
      height: 1222.9924525628148,
      name: '15-32330-20152',
    },
    {
      x: 19503060.64101917,
      y: -4609458.55370921,
      width: 1222.9924525628148,
      height: 1222.9924525628148,
      name: '15-32331-20152',
    },
    {
      x: 19503060.64101917,
      y: -4603343.591446393,
      width: 1222.9924525628148,
      height: 1222.9924525628148,
      name: '15-32331-20147',
    },
    {
      x: 19457809.920274343,
      y: -4593559.651825892,
      width: 2445.9849051256297,
      height: 2445.9849051256297,
      name: '14-16147-10069',
    },
    {
      x: 19457809.920274343,
      y: -4591113.666920764,
      width: 2445.9849051256297,
      height: 2445.9849051256297,
      name: '14-16147-10068',
    },
    {
      x: 19457809.920274343,
      y: -4588667.682015641,
      width: 2445.9849051256297,
      height: 2445.9849051256297,
      name: '14-16147-10067',
    },
    {
      x: 19457809.920274343,
      y: -4581329.727300262,
      width: 2445.9849051256297,
      height: 2445.9849051256297,
      name: '14-16147-10064',
    },
    {
      x: 19460255.905179467,
      y: -4591113.666920764,
      width: 2445.9849051256297,
      height: 2445.9849051256297,
      name: '14-16148-10068',
    },
    {
      x: 19460255.905179586,
      y: -4588667.682015713,
      width: 4891.969810251274,
      height: 4891.969810251274,
      name: '13-8074-5033',
    },
    {
      x: 19460255.905179586,
      y: -4583775.712205462,
      width: 4891.969810251274,
      height: 4891.969810251274,
      name: '13-8074-5032',
    },
    {
      x: 19499391.663661595,
      y: -4608235.561256718,
      width: 4891.969810251274,
      height: 4891.969810251274,
      name: '13-8082-5037',
    },
    {
      x: 19504283.63347185,
      y: -4608235.561256718,
      width: 4891.969810251274,
      height: 4891.969810251274,
      name: '13-8083-5037',
    },
    {
      x: 19504283.63347185,
      y: -4603343.591446467,
      width: 4891.969810251274,
      height: 4891.969810251274,
      name: '13-8083-5036',
    },
  ],
};

export const Provider: ConfigProvider = {
  name: 'main',
  id: 'pv_linz',
  updatedAt: Date.now(),
  version: 1,
  serviceIdentification: {
    accessConstraints: 'the accessConstraints',
    description: 'the description',
    fees: 'the fees',
    title: 'the title',
  },
  serviceProvider: {
    contact: {
      address: {
        city: 'the city',
        country: 'the country',
        deliveryPoint: 'the deliveryPoint',
        email: 'email address',
        postalCode: 'the postalCode',
      },
      individualName: 'the contact name',
      phone: 'the phone',
      position: 'the position',
    },
    name: 'the name',
    site: 'https://example.provider.com',
  },
};

export class FakeData {
  static tileSetRaster(name: string): ConfigTileSetRaster {
    const tileSet = JSON.parse(JSON.stringify(TileSetAerial)) as ConfigTileSetRaster;

    tileSet.name = name;
    tileSet.id = `ts_${name}`;

    return tileSet;
  }

  static tileSetVector(name: string): ConfigTileSetVector {
    const tileSet = JSON.parse(JSON.stringify(TileSetVector)) as ConfigTileSetVector;

    tileSet.name = name;
    tileSet.id = `ts_${name}`;

    return tileSet;
  }

  static tileSetElevation(name: string): ConfigTileSetRaster {
    const tileSet = JSON.parse(JSON.stringify(TileSetElevation)) as ConfigTileSetRaster;

    tileSet.name = name;
    tileSet.id = `ts_${name}`;

    return tileSet;
  }

  static bundle(configs: BaseConfig[]): string {
    const cfg = new ConfigProviderMemory();
    for (const rec of configs) cfg.put(rec);
    const output = cfg.toJson();
    const fsMemory = new FsMemory();

    const configPath = `memory://linz-basemaps/${output.hash}.json`;
    fsMemory.files.set(configPath, { buffer: Buffer.from(JSON.stringify(output)) });
    fsa.register(configPath, fsMemory);

    return base58.encode(Buffer.from(configPath));
  }
}
