import { Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import path from 'path';
import { isGzip, serveFromCotar } from '../util/cotar.serve.js';
import { Etag } from '../util/etag.js';
import { NotFound, NotModified } from '../util/response.js';

interface FontGet {
  Params: { fontStack: string; range: string };
}

export async function fontGet(req: LambdaHttpRequest<FontGet>): Promise<LambdaHttpResponse> {
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return NotFound();

  const targetFile = path.join('fonts', req.params.fontStack, req.params.range) + '.pbf';
  if (assetLocation.endsWith('.tar.co')) {
    return serveFromCotar(req, assetLocation, targetFile, 'application/x-protobuf');
  }

  try {
    const filePath = fsa.join(assetLocation, targetFile);
    const buf = await fsa.read(filePath);

    const cacheKey = Etag.key(buf);
    if (Etag.isNotModified(req, cacheKey)) return NotModified();

    const response = LambdaHttpResponse.ok().buffer(buf, 'application/x-protobuf');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    if (isGzip(buf)) response.header(HttpHeader.ContentEncoding, 'gzip');
    return response;
  } catch (e: any) {
    if (e.code === 404) return NotFound();
    throw e;
  }
}

/** Get the unique name of folders is a path that contain .pbf files */
export async function getFonts(fontPath: string): Promise<string[]> {
  const fonts = new Set<string>();

  // TODO use {recursive: false}
  for await (const font of fsa.list(fontPath)) {
    if (!font.endsWith('.pbf')) continue;
    const dirName = path.basename(path.dirname(font)); // TODO this only works for /a/b.pbf and not /a/b/c.pbf
    if (dirName.includes('/')) continue;
    fonts.add(dirName);
  }
  // Ensure the fonts are alphabetical
  return [...fonts].sort();
}

export async function fontList(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return NotFound();

  if (assetLocation.endsWith('.tar.co')) return serveFromCotar(req, assetLocation, 'fonts.json', 'application/json');

  try {
    const filePath = fsa.join(assetLocation, '/fonts');
    const fonts = await getFonts(filePath);

    const cacheKey = Etag.key(fonts);
    if (Etag.isNotModified(req, cacheKey)) return NotModified();

    const response = LambdaHttpResponse.ok().buffer(JSON.stringify(fonts), 'application/json');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    return response;
  } catch (e: any) {
    if (e.code === 404) return NotFound();
    throw e;
  }
}
