import { Config, ConfigBundled, ConfigProviderMemory } from '@basemaps/config';
import { Env, fsa, LogConfig } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaHttpResponse, LambdaUrlRequest, lf } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { Router } from './router.js';
import { Ping, Version } from './routes/api.js';
import { Esri } from './routes/esri/rest.js';
import { Health } from './routes/health.js';
import { Imagery } from './routes/imagery.js';
import { Tiles } from './routes/tile.js';
import { St } from './source.tracer.js';

const app = new Router();

app.get('ping', Ping);
app.get('health', Health);
app.get('version', Version);
app.get('tiles', Tiles);
app.get('imagery', Imagery);
app.get('esri', Esri);

const isMissingUrlBase = Env.get(Env.PublicUrlBase) == null;

const configPath = Env.get(Env.ConfigPath);

let configLoader: Promise<void> | null = null;
/** Load configuration from a JSON file if specified */
function loadConfig(req: LambdaHttpRequest): Promise<void> {
  if (configLoader != null) return configLoader;
  if (configPath == null) {
    configLoader = Promise.resolve();
    return configLoader;
  }

  req.timer.start('config:load');
  req.log.info({ path: configPath }, 'Config:Load');
  configLoader = Promise.resolve().then(async () => {
    const data = await fsa.readJson<ConfigBundled>(configPath);
    const mem = ConfigProviderMemory.fromJson(data);
    Config.setConfigProvider(mem);
    req.timer.end('config:load');
    req.log.info({ path: configPath }, 'Config:Loaded');
  });
  return configLoader;
}

let slowTimer: NodeJS.Timer | null = null;
export async function handleRequest(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  // Ensure a public url is set
  if (isMissingUrlBase && LambdaUrlRequest.is(req.event)) {
    process.env[Env.PublicUrlBase] = `https://${req.event.requestContext.domainName}`;
  }

  await loadConfig(req);
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

function redirectToBasemaps(req: LambdaHttpRequest): LambdaHttpResponse {
  const redirect = new LambdaHttpResponse(302, 'Found');
  redirect.header('Location', fsa.join('https://basemaps.linz.govt.nz/', req.path));
  return redirect;
}

// Sprites and glyphs are not bundled by the server redirect these to basemaps
handler.router.get('/glyphs/*', redirectToBasemaps);
handler.router.get('/sprites/*', redirectToBasemaps);

// All other requests go via the old request handler
handler.router.get('*', handleRequest);
