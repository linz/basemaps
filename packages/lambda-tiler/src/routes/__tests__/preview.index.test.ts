import { Env, LogConfig, V, fsa } from '@basemaps/shared';
import { LambdaAlbRequest, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { ALBEvent, Context } from 'aws-lambda';
import o from 'ospec';

import { loadAndServeIndexHtml } from '../preview.index.js';
import { LocationUrl } from '@basemaps/geo';
import { FsMemory } from '@chunkd/source-memory';

o.spec('/@*', async () => {
  o.specTimeout(1000);
  const baseRequest: ALBEvent = {
    requestContext: null as any,
    httpMethod: 'get',
    path: '/@-41.89000,174.04924,z5',
    body: null,
    isBase64Encoded: false,
  };

  const fsMem = new FsMemory();
  let lastLocation: string | undefined;
  o.beforeEach(() => {
    fsa.register('memory://', fsMem);
    lastLocation = process.env[Env.StaticAssetLocation];
  });
  o.afterEach(() => {
    if (lastLocation == null) delete process.env[Env.StaticAssetLocation];
    else process.env[Env.StaticAssetLocation] = lastLocation;
  });

  o('Should redirect on failure to load', async () => {
    const ctx: LambdaHttpRequest = new LambdaAlbRequest(baseRequest, {} as Context, LogConfig.get());

    const res = await loadAndServeIndexHtml(ctx);
    o(res.status).equals(302);
    o(res.header('location')).equals('/?');
  });

  o('Should redirect with querystring on failure to load', async () => {
    const evt: ALBEvent = { ...baseRequest, queryStringParameters: { config: 'config-latest.json' } };
    const ctx: LambdaHttpRequest = new LambdaAlbRequest(evt, {} as Context, LogConfig.get());

    const res = await loadAndServeIndexHtml(ctx);
    o(res.status).equals(302);
    o(res.header('location')).equals('/?config=config-latest.json');
  });

  o('Should redirect with querystring and location on failure to load', async () => {
    const evt: ALBEvent = { ...baseRequest, queryStringParameters: { config: 'config-latest.json' } };
    const loc = LocationUrl.fromLocation(evt.path);
    const ctx: LambdaHttpRequest = new LambdaAlbRequest(evt, {} as Context, LogConfig.get());

    const res = await loadAndServeIndexHtml(ctx, loc);
    o(res.status).equals(302);
    o(res.header('location')).equals('/?config=config-latest.json#@-41.89,174.04924,z5');
  });

  o('should redirect on failure to load index.html', async () => {
    const ctx: LambdaHttpRequest = new LambdaAlbRequest(baseRequest, {} as Context, LogConfig.get());
    process.env[Env.StaticAssetLocation] = 'memory://assets/';

    const res = await loadAndServeIndexHtml(ctx);
    o(res.status).equals(302);
  });

  o('should redirect with new tags!', async () => {
    const ctx = new LambdaAlbRequest(baseRequest, {} as Context, LogConfig.get());
    process.env[Env.StaticAssetLocation] = 'memory://assets/';

    const indexHtml = V('html', [
      V('head', [
        V('meta', { property: 'og:title', content: 'LINZ Basemaps' }),
        V('meta', { property: 'og:image', content: '/basemaps-card.jepg' }),
        V('meta', { name: 'viewport' }),
      ]),
    ]).toString();
    console.log(indexHtml);
    await fsa.write('memory://assets/index.html', indexHtml);

    // Pass back the body un altered
    const res = await loadAndServeIndexHtml(ctx);
    o(getBody(res)?.toString()).equals(indexHtml);

    // Replace og:title with a <fake tag />
    const resB = await loadAndServeIndexHtml(ctx, null, new Map([['og:title', '<fake tag />']]));
    o(getBody(resB)?.toString().includes('<fake tag />')).equals(true);
  });
});

function getBody(res: LambdaHttpResponse): Buffer | null {
  if (res._body == null) return null;
  if (res.isBase64Encoded) return Buffer.from(res._body as string, 'base64');
  return Buffer.from(res._body as string);
}
