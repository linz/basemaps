import { ConfigProvider } from '@basemaps/config';
import { TileMatrixSet } from '@basemaps/geo';
import { LogConfig } from '@basemaps/shared';
import { LambdaAlbRequest, LambdaHttpRequest } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import { TileSetRaster } from '../tile.set.raster.js';
import { TileSetVector } from '../tile.set.vector.js';

export function mockRequest(path: string, method = 'get', headers: Record<string, string> = {}): LambdaHttpRequest {
  return new LambdaAlbRequest(
    {
      requestContext: null as any,
      httpMethod: method.toUpperCase(),
      path,
      headers,
      body: null,
      isBase64Encoded: false,
    },
    {} as Context,
    LogConfig.get(),
  );
}

export class FakeTileSet extends TileSetRaster {
  constructor(name: string, tileMatrix: TileMatrixSet, title = `${name}:title`, description = `${name}:description`) {
    super(name, tileMatrix);
    this.tileSet = {
      name,
      title,
      description,
      layers: [{ name: `imagery_${name}`, [tileMatrix.projection.code]: `im_${title}` }],
    } as any;
  }
}

export class FakeTileSetVector extends TileSetVector {
  constructor(name: string, tileMatrix: TileMatrixSet) {
    super(name, tileMatrix);
    this.tileSet = {} as any;
  }
}

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
