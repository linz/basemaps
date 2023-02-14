import { handler } from '@basemaps/lambda-tiler';
import { fsa, getDefaultConfig, LogType, setDefaultConfig } from '@basemaps/shared';
import formBodyPlugin from '@fastify/formbody';
import fastifyStatic from '@fastify/static';
import { LambdaUrlRequest, UrlEvent } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import fastify, { FastifyInstance } from 'fastify';
import { createRequire } from 'module';
import path from 'path';
import ulid from 'ulid';
import { URL } from 'url';
import { loadConfig, ServerOptions } from './config.js';

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

export async function createServer(opts: ServerOptions, logger: LogType): Promise<FastifyInstance> {
  const BasemapsServer = fastify({});
  BasemapsServer.register(formBodyPlugin);

  const cfg = await loadConfig(opts, logger);
  setDefaultConfig(cfg);

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
    if (!url.searchParams.has('api')) url.searchParams.set('api', 'd' + instanceId);

    const request = new LambdaUrlRequest(
      {
        requestContext: { http: { method: req.method.toUpperCase() } },
        headers: req.headers,
        rawPath: url.pathname,
        rawQueryString: url.searchParams.toString(),
        isBase64Encoded: false,
      } as UrlEvent,
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
