import { handler } from '@basemaps/lambda-tiler';
import fastifyStatic from '@fastify/static';
import { lf } from '@linzjs/lambda';
import { ALBEvent, ALBResult, APIGatewayProxyResultV2, CloudFrontRequestResult, Context } from 'aws-lambda';
import fastify from 'fastify';
import { exists, existsSync } from 'fs';
import { createRequire } from 'module';
import { dirname } from 'path';
import ulid from 'ulid';
import { fileURLToPath, pathToFileURL, URL } from 'url';

export const BasemapsServer = fastify();

function isAlbResult(r: ALBResult | CloudFrontRequestResult | APIGatewayProxyResultV2): r is ALBResult {
  if (typeof r !== 'object') return false;
  if (r == null) return false;
  return 'statusCode' in r;
}

const instanceId = ulid.ulid();

// const fileName = dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);
const landingLocation = require.resolve('@basemaps/landing/dist');

BasemapsServer.register(fastifyStatic, { root: dirname(landingLocation) });

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
