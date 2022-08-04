import { Env } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { NotFound } from '../util/response.js';

export async function arcgisInfoGet(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const host = Env.get(Env.PublicUrlBase);
  if (host == null) return NotFound();
  const info = {
    currentVersion: 10.1,
    fullVersion: '10.1',
    owningSystemUrl: host,
  };

  const json = JSON.stringify(info);
  const data = Buffer.from(json);

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
  response.buffer(data);
  req.set('bytes', data.byteLength);
  return response;
}
