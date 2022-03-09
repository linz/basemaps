import { lf, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { LogConfig } from '@basemaps/shared';
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

let slowTimer: NodeJS.Timer | null = null;
export async function handleRequest(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  // Reset the request tracing
  St.reset();
  // TODO this could be relaxed to every say 5% of requests if logging gets too verbose.
  req.set('requests', St.requests);

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
    return await app.handle(req);
  } finally {
    if (slowTimer) clearTimeout(slowTimer);
    slowTimer = null;
  }
}

export const handler = lf.http(handleRequest, LogConfig.get());
