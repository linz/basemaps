import { handler } from '@basemaps/lambda-tiler';
import { lf } from '@linzjs/lambda';
import { ALBEvent, ALBResult, APIGatewayProxyResultV2, CloudFrontRequestResult, Context } from 'aws-lambda';
import fastify from 'fastify';
import ulid from 'ulid';

export const BasemapsServer = fastify();

function isAlbResult(r: ALBResult | CloudFrontRequestResult | APIGatewayProxyResultV2): r is ALBResult {
  if (typeof r !== 'object') return false;
  if (r == null) return false;
  return 'statusCode' in r;
}

const instanceId = ulid.ulid();

BasemapsServer.get<{ Querystring: { api: string } }>('/v1/*', async (req, res) => {
  const event: ALBEvent = {
    httpMethod: 'GET',
    requestContext: { elb: { targetGroupArn: 'arn:fake' } },
    path: req.url,
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
