import { HttpHeader, LambdaHttpResponse } from '@linzjs/lambda';

const OkResponse = new LambdaHttpResponse(200, 'ok');
OkResponse.header(HttpHeader.CacheControl, 'no-store');

export function pingGet(): Promise<LambdaHttpResponse> {
  return Promise.resolve(OkResponse);
}
