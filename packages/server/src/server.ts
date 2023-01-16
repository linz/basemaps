import { ConfigBundled, ConfigJson, ConfigPrefix, ConfigProviderDynamo, ConfigProviderMemory } from '@basemaps/config';
import { handler } from '@basemaps/lambda-tiler';
import { fsa, getDefaultConfig, LogType, setDefaultConfig } from '@basemaps/shared';
import formBodyPlugin from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import { LambdaUrlRequest } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import fastify, { FastifyInstance } from 'fastify';
import { createRequire } from 'module';
import path from 'path';
import ulid from 'ulid';
import { URL } from 'url';

const instanceId = ulid.ulid();

function getLandingLocation(): string | null {
  try {
    if (typeof require !== 'undefined' && typeof require.resolve === 'function') {
      return require.resolve('@basemaps/landing/dist');
    } else {
      const require = createRequire(import.meta.url);
      return require.resolve('@basemaps/landing/dist');
    }
  } catch (e) {
    return null;
  }
}

export interface ServerOptions {
  /** Path to assets */
  assets?: string;

  /** Path to configuration or a dynamdb table */
  config: string;
}

export async function createServer(opts: ServerOptions, logger: LogType): Promise<FastifyInstance> {
  const BasemapsServer = fastify({});
  BasemapsServer.register(formBodyPlugin);

  if (opts.config.startsWith('dynamodb://')) {
    // Load config from dynamodb table
    const table = opts.config.slice('dynamodb://'.length);
    logger.info({ path: opts.config, table, mode: 'dynamo' }, 'Starting Server');
    setDefaultConfig(new ConfigProviderDynamo(table));
  } else if (opts.config.startsWith(ConfigPrefix.ConfigBundle)) {
    // Load Bundled config by dynamo reference
    const cb = await getDefaultConfig().ConfigBundle.get(opts.config);
    if (cb == null) throw new Error(`Config bunble not exists for ${opts.config}`);
    const configJson = await fsa.readJson<ConfigBundled>(cb.path);
    const mem = ConfigProviderMemory.fromJson(configJson);
    mem.createVirtualTileSets();
    setDefaultConfig(mem);
  } else if (opts.config.endsWith('.json') || opts.config.endsWith('.json.gz')) {
    // Bundled config
    logger.info({ path: opts.config, mode: 'config:bundle' }, 'Starting Server');
    const configJson = await fsa.readJson<ConfigBundled>(opts.config);
    const mem = ConfigProviderMemory.fromJson(configJson);
    mem.createVirtualTileSets();
    setDefaultConfig(mem);
  } else {
    const mem = await ConfigJson.fromPath(opts.config, logger);
    logger.info({ path: opts.config, mode: 'config' }, 'Starting Server');
    mem.createVirtualTileSets();
    setDefaultConfig(mem);
  }

  if (opts.assets) {
    const isExists = await fsa.exists(opts.assets);
    if (!isExists) throw new Error(`--assets path "${opts.assets}" does not exist`);
    logger.info({ path: opts.assets }, 'Config:Assets');
    getDefaultConfig().assets = opts.assets;
  }

  const landingLocation = getLandingLocation();
  if (landingLocation == null) {
    logger.warn('Server:Landing:Failed');
  } else {
    const root = path.join(path.dirname(landingLocation), '..', 'dist');
    logger.info({ path: root }, 'Server:Landing');
    BasemapsServer.register(fastifyStatic, { root });
  }

  BasemapsServer.all<{ Querystring: { api: string } }>('/v1/*', (req, res) => {
    const url = new URL(`${req.protocol}://${req.hostname}${req.url}`);
    if (!url.searchParams.has('api')) url.searchParams.set('api', 'c' + instanceId);

    const request = new LambdaUrlRequest(
      {
        requestContext: { http: { method: req.method.toUpperCase() } },
        headers: req.headers,
        rawPath: url.pathname,
        rawQueryString: url.searchParams.toString(),
        isBase64Encoded: false,
      } as any,
      {} as Context,
      logger,
    );

    handler.router
      .handle(request)
      .then((r) => {
        res.status(r.status);
        for (const [key, value] of r.headers.entries()) res.header(key, String(value));
        res.send(Buffer.from(r.body, r.isBase64Encoded ? 'base64' : undefined));
      })
      .catch((e) => {
        request.log.fatal({ err: e }, 'RequestFailed');
        res.status(500);
        res.send(e);
      });
  });

  return BasemapsServer;
}
