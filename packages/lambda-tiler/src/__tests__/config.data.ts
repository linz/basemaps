import { ConfigTileSetRaster, TileSetType, ConfigImagery, ConfigProvider } from '@basemaps/config';
import { ImageFormat } from '@basemaps/geo';

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
  id: 'pv_main_production',
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
