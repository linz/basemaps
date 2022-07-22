import { AssetProvider } from '@basemaps/config';
import { fsa } from '@chunkd/fs';
import { Cotar } from '@cotar/core';
import { LambdaHttpResponse } from '@linzjs/lambda';
import { NotFound } from './routes/response.js';
import { St } from './source.tracer.js';

export class CotarCache {
  static cache = new Map<string, Promise<Cotar | null>>();

  static get(uri: string): Promise<Cotar | null> {
    let existing = CotarCache.cache.get(uri);
    if (existing == null) {
      const source = fsa.source(uri);
      St.trace(source);
      existing = Cotar.fromTar(source);
      CotarCache.cache.set(uri, existing);
    }
    return existing;
  }
}

/**
 *  Load a assets from local path or cotar returning the file back as a LambdaResponse
 *
 * This will also set two headers
 * - Content-Encoding if the file starts with gzip magic
 * - Content-Type from the parameter contentType
 */
export async function serveAssets(path: string, file: string, contentType: string): Promise<LambdaHttpResponse> {
  const assetsProvider = new AssetProvider(path);
  const buf = await assetsProvider.get(file);
  if (buf == null) return NotFound;
  const ret = LambdaHttpResponse.ok().buffer(buf, contentType);
  if (isGzip(buf)) ret.header('content-encoding', 'gzip');
  return ret;
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
