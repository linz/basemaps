import { ImageFormat } from '@basemaps/geo';
import { LogConfig } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaUrlRequest } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import o from 'ospec';
import { getImageFormats } from '../tile.wmts.js';

o.spec('GetImageFormats', () => {
  function newRequest(path: string, query: string): LambdaHttpRequest {
    return new LambdaUrlRequest(
      {
        requestContext: { http: { method: 'GET' } },
        headers: {},
        rawPath: path,
        rawQueryString: query,
        isBase64Encoded: false,
      } as any,
      {} as Context,
      LogConfig.get(),
    );
  }

  o('should parse all formats', () => {
    const req = newRequest('/v1/blank', 'format=png&format=jpeg');
    const formats = getImageFormats(req);
    o(formats).deepEquals([ImageFormat.Png, ImageFormat.Jpeg]);
  });

  o('should ignore bad formats', () => {
    const req = newRequest('/v1/blank', 'format=fake&format=mvt');
    const formats = getImageFormats(req);
    o(formats).equals(undefined);
  });

  o('should de-dupe formats', () => {
    const req = newRequest('/v1/blank', 'format=png&format=jpeg&format=png&format=jpeg&format=png&format=jpeg');
    const formats = getImageFormats(req);
    o(formats).deepEquals([ImageFormat.Png, ImageFormat.Jpeg]);
  });
});
