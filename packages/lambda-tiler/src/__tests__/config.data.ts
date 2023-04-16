import {
  base58,
  BaseConfig,
  ConfigImagery,
  ConfigProvider,
  ConfigProviderMemory,
  ConfigTileSetRaster,
  ConfigTileSetVector,
  TileSetType,
} from '@basemaps/config';
import { ImageFormat, VectorFormat } from '@basemaps/geo';
import { fsa } from '@basemaps/shared';
import { FsMemory } from '@chunkd/source-memory';

export const TileSetAerial: ConfigTileSetRaster = {
  id: 'ts_aerial',
  name: 'aerial',
  type: TileSetType.Raster,
  format: ImageFormat.Webp,
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
  format: VectorFormat.MapboxVectorTiles,
  layers: [
    {
      3857: 's3://linz-basemaps/01G7WQMGHB7V946M0YWJJBZ6DW/topopgraphic.tar.co',
      title: 'Vector tiles',
      category: 'Vector Tiles',
      name: 'Vector tiles',
    },
  ],
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
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [174.79441663, -38.0938023],
          [174.80835721, -38.09358853],
          [174.80862882, -38.10460555],
          [174.8644208, -38.10373324],
          [174.86218477, -38.0155812],
          [174.8482594, -38.01580097],
          [174.84798272, -38.00478403],
          [174.84102102, -38.00489326],
          [174.84088325, -37.99938476],
          [174.83392203, -37.99949355],
          [174.83378483, -37.99398503],
          [174.8059189, -37.99441635],
          [174.80618918, -38.00543357],
          [174.7922653, -38.00564666],
          [174.79253408, -38.01668196],
          [174.79949709, -38.01657558],
          [174.79963184, -38.02208419],
          [174.80659533, -38.02197737],
          [174.80761059, -38.0632736],
          [174.8041269, -38.06332714],
          [174.80419456, -38.06608142],
          [174.80071072, -38.06613486],
          [174.8008458, -38.07164342],
          [174.79387759, -38.07175001],
          [174.79441663, -38.0938023],
        ],
      ],
      [
        [
          [175.17435213, -38.20860996],
          [175.20227038, -38.20808931],
          [175.20293479, -38.23011758],
          [175.25880875, -38.22905512],
          [175.25736203, -38.18224672],
          [175.26085039, -38.18217957],
          [175.26076526, -38.17942613],
          [175.26425349, -38.17935889],
          [175.26408245, -38.173834],
          [175.26059449, -38.17390123],
          [175.26050939, -38.17114778],
          [175.25702155, -38.1712149],
          [175.25608773, -38.14092683],
          [175.20028095, -38.14198595],
          [175.20094319, -38.16401449],
          [175.17304173, -38.16453432],
          [175.17435213, -38.20860996],
        ],
      ],
    ],
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
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [174.79247149, -38.09998972],
          [174.81446211, -38.09998972],
          [174.81446211, -38.09134368],
          [174.82544844, -38.09134368],
          [174.82544844, -38.08485848],
          [174.82819502, -38.08485848],
          [174.82819502, -38.08269662],
          [174.83643476, -38.08269662],
          [174.83643476, -38.06539942],
          [174.85840742, -38.06539942],
          [174.85840742, -37.9961556],
          [174.81446211, -37.9961556],
          [174.81446211, -37.9961556],
          [174.79247149, -37.9961556],
          [174.79247149, -38.01348331],
          [174.80345781, -38.01348331],
          [174.80345781, -38.02213855],
          [174.81444414, -38.02213855],
          [174.81444414, -38.04808399],
          [174.79247149, -38.04808399],
          [174.79247149, -38.09998972],
        ],
      ],
      [
        [
          [175.16600664, -38.20366238],
          [175.1879793, -38.20366238],
          [175.1879793, -38.21229511],
          [175.20996992, -38.21229511],
          [175.20996992, -38.20797887],
          [175.21546308, -38.20797887],
          [175.21546308, -38.20366238],
          [175.25391523, -38.20366238],
          [175.25391523, -38.18207606],
          [175.2594084, -38.18207606],
          [175.2594084, -38.17342562],
          [175.25391523, -38.17342562],
          [175.25391523, -38.13454951],
          [175.20995195, -38.13454951],
          [175.20995195, -38.16046922],
          [175.19896563, -38.16046922],
          [175.19896563, -38.16694771],
          [175.19621904, -38.16694771],
          [175.19621904, -38.16910707],
          [175.16600664, -38.16910707],
          [175.16600664, -38.20366238],
        ],
      ],
    ],
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
    const tileSet = JSON.parse(JSON.stringify(TileSetAerial));

    tileSet.name = name;
    tileSet.id = `ts_${name}`;

    return tileSet;
  }

  static tileSetVector(name: string): ConfigTileSetVector {
    const tileSet = JSON.parse(JSON.stringify(TileSetVector));

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
    fsMemory.files.set(configPath, Buffer.from(JSON.stringify(output)));
    fsa.register(configPath, fsMemory);

    return base58.encode(Buffer.from(configPath));
  }
}
