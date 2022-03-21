import { ConfigProvider } from '@basemaps/config';
import { TileMatrixSet } from '@basemaps/geo';
import { LambdaHttpRequest, LambdaAlbRequest } from '@linzjs/lambda';
import { LogConfig } from '@basemaps/shared';
import { TileSetRaster } from '../tile.set.raster.js';
import { Context } from 'aws-lambda';

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
    this.tileSet = { title, description } as any;
  }
}

export const Provider: ConfigProvider = {
  createdAt: Date.now(),
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
