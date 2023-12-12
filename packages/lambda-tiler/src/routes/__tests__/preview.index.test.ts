import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { LocationUrl } from '@basemaps/geo';
import { Env, fsa, LogConfig, V } from '@basemaps/shared';
import { FsMemory } from '@chunkd/source-memory';
import { LambdaAlbRequest, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { ALBEvent, Context } from 'aws-lambda';

import { FakeData } from '../../__tests__/config.data.js';
import { loadAndServeIndexHtml, PreviewIndexGet, previewIndexGet } from '../preview.index.js';

describe('/@*', async () => {
  // o.specTimeout(1000);
  const baseRequest: ALBEvent = {
    requestContext: null as any,
    httpMethod: 'get',
    path: '/@-41.8900012,174.0492432,z5',
    body: null,
    isBase64Encoded: false,
  };

  const fsMem = new FsMemory();
  let lastLocation: string | undefined;
  beforeEach(() => {
    fsa.register('memory://', fsMem);
    lastLocation = process.env[Env.StaticAssetLocation];
  });
  afterEach(() => {
    if (lastLocation == null) delete process.env[Env.StaticAssetLocation];
    else process.env[Env.StaticAssetLocation] = lastLocation;
  });

  it('Should redirect on failure to load', async () => {
    const ctx: LambdaHttpRequest = new LambdaAlbRequest(baseRequest, {} as Context, LogConfig.get());

    const res = await loadAndServeIndexHtml(ctx);
    assert.equal(res.status, 302);
    assert.equal(res.header('location'), '/?');
  });

  it('Should redirect with querystring on failure to load', async () => {
    const evt: ALBEvent = { ...baseRequest, queryStringParameters: { config: 'config-latest.json' } };
    const ctx: LambdaHttpRequest = new LambdaAlbRequest(evt, {} as Context, LogConfig.get());

    const res = await loadAndServeIndexHtml(ctx);
    assert.equal(res.status, 302);
    assert.equal(res.header('location'), '/?config=config-latest.json');
  });

  it('Should redirect with querystring and location on failure to load', async () => {
    const evt: ALBEvent = { ...baseRequest, queryStringParameters: { config: 'config-latest.json' } };
    const loc = LocationUrl.fromSlug(evt.path);
    const ctx: LambdaHttpRequest = new LambdaAlbRequest(evt, {} as Context, LogConfig.get());

    const res = await loadAndServeIndexHtml(ctx, loc);
    assert.equal(res.status, 302);
    assert.equal(res.header('location'), '/?config=config-latest.json#@-41.8900012,174.0492432,z5');
  });

  it('should redirect on failure to load index.html', async () => {
    const ctx: LambdaHttpRequest = new LambdaAlbRequest(baseRequest, {} as Context, LogConfig.get());
    process.env[Env.StaticAssetLocation] = 'memory://assets/';

    const res = await loadAndServeIndexHtml(ctx);
    assert.equal(res.status, 302);
  });

  it('should redirect with new tags!', async () => {
    const ctx = new LambdaAlbRequest(baseRequest, {} as Context, LogConfig.get());
    process.env[Env.StaticAssetLocation] = 'memory://assets/';

    const indexHtml = V('html', [
      V('head', [
        V('meta', { property: 'og:title', content: 'LINZ Basemaps' }),
        V('meta', { property: 'og:image', content: '/basemaps-card.jepg' }),
        V('meta', { name: 'viewport' }),
      ]),
    ]).toString();

    await fsa.write('memory://assets/index.html', indexHtml);

    // Pass back the body un altered
    const res = await loadAndServeIndexHtml(ctx);
    assert.equal(getBody(res)?.toString(), indexHtml);

    // Replace og:title with a <fake tag />
    const resB = await loadAndServeIndexHtml(ctx, null, new Map([['og:title', '<fake tag />']]));
    assert.equal(getBody(resB)?.toString().includes('<fake tag />'), true);
  });

  it('should include config url', async () => {
    const ctx = new LambdaAlbRequest(
      {
        ...baseRequest,
        queryStringParameters: { config: 'memory://linz-basemaps/config-latest.json', i: 'imagery-name' },
      },
      {} as Context,
      LogConfig.get(),
    ) as unknown as LambdaHttpRequest<PreviewIndexGet>;
    ctx.params = { location: '@-41.8900012,174.0492432,z5' };

    // Create a fake config to use
    const expectedConfig = new ConfigProviderMemory();
    expectedConfig.put(FakeData.tileSetRaster('imagery-name'));
    await fsa.write('memory://linz-basemaps/config-latest.json', JSON.stringify(expectedConfig.toJson()));

    process.env[Env.StaticAssetLocation] = 'memory://assets/';

    const indexHtml = V('html', [
      V('head', [
        V('meta', { property: 'og:title', content: 'LINZ Basemaps' }),
        V('meta', { property: 'og:image', content: '/basemaps-card.jepg' }),
        V('meta', { name: 'viewport' }),
      ]),
    ]).toString();

    await fsa.write('memory://assets/index.html', indexHtml);

    const res = await previewIndexGet(ctx);
    assert.equal(res.status, 200);

    const ogImage = getBody(res)
      ?.toString()
      .split('\n')
      .find((f) => f.includes('og:image'));
    assert.equal(
      ogImage,
      '<meta name="twitter:image" property="og:image" content="/v1/preview/imagery-name/WebMercatorQuad/5/174.0492432/-41.8900012?config=QzX7ZsK6qG6p42wHZaF9dhihsgprX942gAuKwfryknM429iqxdDiRSGu" />',
    );
  });
});

function getBody(res: LambdaHttpResponse): Buffer | null {
  if (res._body == null) return null;
  if (res.isBase64Encoded) return Buffer.from(res._body as string, 'base64');
  return Buffer.from(res._body as string);
}
