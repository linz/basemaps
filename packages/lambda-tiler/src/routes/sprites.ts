import { Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import path from 'path';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { NotFound, NotModified } from '../util/response.js';
import { isGzip, serveFromCotar } from '../util/cotar.serve.js';
import { Etag } from '../util/etag.js';

interface SpriteGet {
  Params: {
    spriteName: string;
  };
}

const Extensions = new Map();
Extensions.set('.png', 'image/png');
Extensions.set('.json', 'application/json');

export async function spriteGet(req: LambdaHttpRequest<SpriteGet>): Promise<LambdaHttpResponse> {
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return NotFound;

  const extension = path.extname(req.params.spriteName);
  const mimeType = Extensions.get(extension);
  if (mimeType == null) return NotFound;

  const targetFile = fsa.join('sprites', req.params.spriteName);
  if (assetLocation.endsWith('.tar.co')) return serveFromCotar(req, assetLocation, targetFile, mimeType);

  try {
    const filePath = fsa.join(assetLocation, targetFile);
    req.set('target', filePath);

    const buf = await fsa.read(filePath);
    const cacheKey = Etag.key(buf);
    if (Etag.isNotModified(req, cacheKey)) return NotModified;

    const response = LambdaHttpResponse.ok().buffer(buf, mimeType);
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    if (isGzip(buf)) response.header('content-encoding', 'gzip');
    return response;
  } catch (e: any) {
    if (e.code === 404) return NotFound;
    throw e;
  }
}
