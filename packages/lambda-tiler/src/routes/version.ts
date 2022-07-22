import { HttpHeader, LambdaHttpResponse } from '@linzjs/lambda';

export async function versionGet(): Promise<LambdaHttpResponse> {
  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.CacheControl, 'no-store');
  response.json({ version: process.env.GIT_VERSION ?? 'dev', hash: process.env.GIT_HASH });
  return response;
}
