import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { Etag } from './etag.js';
import { NotFound, NotModified } from './response.js';
import { CoSources } from './source.cache.js';

/**
 *  Load a cotar and look for a file inside the cotar returning the file back as a LambdaResponse
 *
 * This will also set two headers
 * - Content-Encoding if the file starts with gzip magic
 * - Content-Type from the parameter contentType
 */
export async function serveFromCotar(
  req: LambdaHttpRequest,
  url: URL,
  assetPath: string,
  contentType: string,
): Promise<LambdaHttpResponse> {
  const cotar = await CoSources.getCotar(url);
  if (cotar == null) return NotFound();
  const fileData = await cotar.get(assetPath);
  if (fileData == null) return NotFound();

  const buf = Buffer.from(fileData);

  const cacheKey = Etag.key(buf);
  if (Etag.isNotModified(req, cacheKey)) return NotModified();

  const response = LambdaHttpResponse.ok().buffer(buf, contentType);
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
  if (isGzip(buf)) response.header(HttpHeader.ContentEncoding, 'gzip');
  return response;
}

/**
 * Does a buffer look like a gzipped document instead of raw json
 *
 * Determined by checking the first two bytes are the gzip magic bytes `0x1f 0x8b`
 *
 * @see https://en.wikipedia.org/wiki/Gzip
 *
 */
export function isGzip(b: Buffer): boolean {
  return b[0] === 0x1f && b[1] === 0x8b;
}
