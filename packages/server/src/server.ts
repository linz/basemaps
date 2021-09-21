import { handler } from '@basemaps/lambda-tiler';
import { ALBEvent, ALBResult, APIGatewayProxyResultV2, CloudFrontRequestResult, Context } from 'aws-lambda';
import ulid from 'ulid';
import express from 'express';
import { lf } from '@linzjs/lambda';

export const BasemapsServer = express();

function isAlbResult(r: ALBResult | CloudFrontRequestResult | APIGatewayProxyResultV2): r is ALBResult {
  if (typeof r !== 'object') return false;
  if (r == null) return false;
  return 'statusCode' in r;
}

const instanceId = ulid.ulid();

BasemapsServer.get('/v1/*', async (req: express.Request, res: express.Response) => {
  const event: ALBEvent = {
    httpMethod: 'GET',
    requestContext: { elb: { targetGroupArn: 'arn:fake' } },
    path: req.path,
    headers: req.headers as Record<string, string>,
    queryStringParameters: req.query as Record<string, string>,
    body: null,
    isBase64Encoded: false,
  };
  if (req.query['api'] == null) req.query['api'] = 'c' + instanceId;

  handler(event, {} as Context, (err, r) => {
    if (err || !isAlbResult(r)) {
      lf.Logger.fatal({ err }, 'RequestFailed');
      return res.end(err);
    }

    res.status(r.statusCode);
    for (const [key, value] of Object.entries(r.headers ?? {})) res.header(key, String(value));
    if (r.body) res.send(Buffer.from(r.body, r.isBase64Encoded ? 'base64' : 'utf8'));
    res.end();
  });
});
