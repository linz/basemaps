import { TileMatrixSet } from '@basemaps/geo';
import { LogConfig } from '@basemaps/shared';
import { LambdaAlbRequest, LambdaHttpRequest, LambdaUrlRequest } from '@linzjs/lambda';
import { Context } from 'aws-lambda';

export function mockRequest(path: string, method = 'get', headers: Record<string, string> = {}): LambdaHttpRequest {
  return new LambdaAlbRequest(
    {
      requestContext: null as any,
      httpMethod: method.toUpperCase(),
      path: encodeURI(path),
      headers,
      body: null,
      isBase64Encoded: false,
    },
    {} as Context,
    LogConfig.get(),
  );
}

export function mockUrlRequest(path: string, query: string): LambdaHttpRequest {
  return new LambdaUrlRequest(
    {
      requestContext: { http: { method: 'GET' } },
      headers: {},
      rawPath: encodeURI(path),
      rawQueryString: query,
      isBase64Encoded: false,
    } as any,
    {} as Context,
    LogConfig.get(),
  );
}

// export class FakeTileSet extends TileSetRaster {
//   constructor(name: string, tileMatrix: TileMatrixSet, title = `${name}:title`, description = `${name}:description`) {
//     super(name, tileMatrix);
//     this.tileSet = {
//       name,
//       title,
//       description,
//       layers: [{ name: `imagery_${name}`, [tileMatrix.projection.code]: `im_${title}` }],
//     } as any;
//   }
// }

// export class FakeTileSetVector extends TileSetVector {
//   constructor(name: string, tileMatrix: TileMatrixSet) {
//     super(name, tileMatrix);
//     this.tileSet = {} as any;
//   }
// }

export const Api = {
  key: 'd01f7w7rnhdzg0p7fyrc9v9ard1',
  header: { 'x-linz-api-key': 'd01f7w7rnhdzg0p7fyrc9v9ard1' },
};
