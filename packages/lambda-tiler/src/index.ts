import { LogConfig } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaHttpResponse, lf } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { Router } from './router.js';
import { Ping, Version } from './routes/api.js';
import { fontGet, fontList } from './routes/fonts.js';
import { Health } from './routes/health.js';
import { imageryGet } from './routes/imagery.js';
import { spriteGet } from './routes/sprites.js';
import { Tiles } from './routes/tile.js';
import { St } from './source.tracer.js';

const app = new Router();

app.get('tiles', Tiles);

export async function handleRequest(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const apiKey = Router.apiKey(req);
  if (apiKey != null) {
    const apiKeyHash = createHash('sha256').update(apiKey).digest('base64');
    req.set('api', apiKeyHash);
  }
  return await app.handle(req);
}

export const handler = lf.http(LogConfig.get());

handler.router.hook('request', (req) => {
  req.set('name', 'LambdaTiler');
  // Reset the request tracing before every request
  St.reset();
});

handler.router.hook('response', (req) => {
  if (St.requests.length > 0) {
    // TODO this could be relaxed to every say 5% of requests if logging gets too verbose.
    req.set('requests', St.requests.slice(0, 100)); // limit to 100 requests (some tiles need 100s of requests)
    req.set('requestCount', St.requests.length);
  }
});

handler.router.get('/v1/ping', Ping);
handler.router.get('/v1/health', Health);
handler.router.get('/v1/version', Version);
handler.router.get('/v1/imagery/:imageryId/:fileName', imageryGet);

handler.router.get('/v1/sprites/:spriteName', spriteGet);
handler.router.get('/v1/fonts.json', fontList);
handler.router.get('/v1/fonts/:fontStack/:range.pbf', fontGet);

// Catch all for old requests
handler.router.get('*', handleRequest);
