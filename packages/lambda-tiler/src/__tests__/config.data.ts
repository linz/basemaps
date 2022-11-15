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
  files: [],
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
