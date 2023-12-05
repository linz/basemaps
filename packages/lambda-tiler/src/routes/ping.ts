import { HttpHeader, LambdaHttpResponse } from '@linzjs/lambda';

const OkResponse = new LambdaHttpResponse(200, 'ok');
OkResponse.header(HttpHeader.CacheControl, 'no-store');

export async function pingGet(): Promise<LambdaHttpResponse> {
  return OkResponse;
}
