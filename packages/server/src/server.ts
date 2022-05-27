import { handler } from '@basemaps/lambda-tiler';
import { LogType } from '@basemaps/shared';
import fastifyStatic from '@fastify/static';
import { lf } from '@linzjs/lambda';
import { ALBEvent, ALBResult, APIGatewayProxyResultV2, CloudFrontRequestResult, Context } from 'aws-lambda';
import fastify, { FastifyInstance } from 'fastify';
import { createRequire } from 'module';
import path from 'path';
import ulid from 'ulid';
import { URL } from 'url';

function isAlbResult(r: ALBResult | CloudFrontRequestResult | APIGatewayProxyResultV2): r is ALBResult {
  if (typeof r !== 'object') return false;
  if (r == null) return false;
  return 'statusCode' in r;
}

const instanceId = ulid.ulid();

function getLandingLocation(): string | null {
  if (typeof require !== 'undefined' && typeof require.resolve === 'function') {
    return require.resolve('@basemaps/landing/dist');
  } else {
    const require = createRequire(import.meta.url);
    return require.resolve('@basemaps/landing/dist');
  }
}

export function createServer(logger: LogType): FastifyInstance {
  const BasemapsServer = fastify();

  const landingLocation = getLandingLocation();
  if (landingLocation == null) {
    logger.warn('Server:Landing:Failed');
  } else {
    const root = path.join(path.dirname(landingLocation), '..', 'dist');
    logger.info({ path: root }, 'Server:Landing');
    BasemapsServer.register(fastifyStatic, { root });
  }

  BasemapsServer.get<{ Querystring: { api: string } }>('/v1/*', async (req, res) => {
    const url = new URL(`${req.protocol}://${req.hostname}${req.url}`);
    const event: ALBEvent = {
      httpMethod: 'GET',
      requestContext: { elb: { targetGroupArn: 'arn:fake' } },
      path: url.pathname,
      headers: req.headers as Record<string, string>,
      queryStringParameters: req.query as Record<string, string>,
      body: null,
      isBase64Encoded: false,
    };
    if (req.query.api == null) req.query.api = 'c' + instanceId;

    handler(event, {} as Context, (err, r): void => {
      if (err || !isAlbResult(r)) {
        lf.Logger.fatal({ err }, 'RequestFailed');
        res.send(err);
        return;
      }

      res.status(r.statusCode);
      for (const [key, value] of Object.entries(r.headers ?? {})) res.header(key, String(value));
      if (r.body) res.send(Buffer.from(r.body, r.isBase64Encoded ? 'base64' : 'utf8'));
      else res.send('Not found');
    });
  });

  return BasemapsServer;
}
