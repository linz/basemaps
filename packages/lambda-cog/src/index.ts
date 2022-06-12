import { HttpHeader, LambdaHttpResponse, lf } from '@linzjs/lambda';
import { LogConfig } from '@basemaps/shared';
import { Import } from './routes/import.js';

export const handler = lf.http(LogConfig.get());

handler.router.get('/v1/import', Import);

const OkResponse = new LambdaHttpResponse(200, 'ok');
OkResponse.header(HttpHeader.CacheControl, 'no-store');

handler.router.get('/v1/ping', () => OkResponse);
handler.router.get('/v1/health', () => OkResponse);
handler.router.get('/v1/version', () => {
  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.CacheControl, 'no-store');
  response.json({ version: process.env.GIT_VERSION ?? 'dev', hash: process.env.GIT_HASH });
  return response;
});
