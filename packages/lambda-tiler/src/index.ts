import { lf, LambdaHttpRequest, LambdaHttpResponse, LambdaUrlRequest } from '@linzjs/lambda';
import { Env, LogConfig } from '@basemaps/shared';
import { Ping, Version } from './routes/api.js';
import { Health } from './routes/health.js';
import { Tiles } from './routes/tile.js';
import { Router } from './router.js';
import { createHash } from 'crypto';
import { Imagery } from './routes/imagery.js';
import { Esri } from './routes/esri/rest.js';
import { St } from './source.tracer.js';

const app = new Router();

app.get('ping', Ping);
app.get('health', Health);
app.get('version', Version);
app.get('tiles', Tiles);
app.get('imagery', Imagery);
app.get('esri', Esri);

const isMissingPublicUrl = process.env[Env.PublicUrlBase] == null;
let slowTimer: NodeJS.Timer | null = null;
export async function handleRequest(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {

  // Set the public url base if not already set.
  if (isMissingPublicUrl && LambdaUrlRequest.is(req.event)) {
    process.env[Env.PublicUrlBase] = 'https://' + req.event.requestContext.domainName;
  } 

  // Reset the request tracing
  St.reset();

  // Warn if a request takes more than 10 seconds to process
  if (slowTimer) clearTimeout(slowTimer);
  slowTimer = setTimeout(() => req.log.warn(req.logContext, 'Lambda:Slow'), 10_000);
  slowTimer.unref();

  req.set('name', 'LambdaTiler');
  try {
    const apiKey = Router.apiKey(req);
    if (apiKey != null) {
      const apiKeyHash = createHash('sha256').update(apiKey).digest('base64');
      req.set('api', apiKeyHash);
    }
    const ret = await app.handle(req);

    // TODO this could be relaxed to every say 5% of requests if logging gets too verbose.
    req.set('requests', St.requests.slice(0, 100)); // limit to 100 requests (some tiles need 100s of requests)
    req.set('requestCount', St.requests.length);

    return ret;
  } finally {
    if (slowTimer) clearTimeout(slowTimer);
    slowTimer = null;
  }
}

export const handler = lf.http(LogConfig.get());
handler.router.get('*', handleRequest);
