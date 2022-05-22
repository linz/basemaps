import { lf, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { LogConfig } from '@basemaps/shared';
import { Router } from './router.js';
import { createHash } from 'crypto';
import { Import } from './routes/import.js';

const app = new Router();

app.get('import', Import);

let slowTimer: NodeJS.Timer | null = null;
export async function handleRequest(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  // Warn if a request takes more than 10 seconds to process
  if (slowTimer) clearTimeout(slowTimer);
  slowTimer = setTimeout(() => req.log.warn(req.logContext, 'Lambda:Slow'), 10_000);
  slowTimer.unref();

  req.set('name', 'LambdaCog');
  try {
    const apiKey = Router.apiKey(req);
    if (apiKey != null) {
      const apiKeyHash = createHash('sha256').update(apiKey).digest('base64');
      req.set('api', apiKeyHash);
    }
    const ret = await app.handle(req);

    return ret;
  } finally {
    if (slowTimer) clearTimeout(slowTimer);
    slowTimer = null;
  }
}

export const handler = lf.http(handleRequest, LogConfig.get());
