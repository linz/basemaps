import { Config } from '@basemaps/config';
import { fsa } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { promisify } from 'util';
import { gzip } from 'zlib';
import { Router } from '../router.js';
import { NotModified } from './response.js';
import { TileEtag } from './tile.etag.js';

const gzipP = promisify(gzip);

function isAllowedFile(f: string): boolean {
  if (f.endsWith('.geojson')) return true;
  if (f.endsWith('.json')) return true;
  return false;
}

/**
 * Get metadata around the imagery such as the source bounding box or the bounding box of the COGS
 *
 * @example
 * - /v1/imagery/:imageryId/source.geojson
 * - /v1/imagery/:imageryId/covering.geojson
 */
export async function Imagery(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const { rest } = Router.action(req);
  const [imageryId, requestType] = rest;
  if (!isAllowedFile(requestType)) return new LambdaHttpResponse(404, 'Not found');

  const imagery = await Config.Imagery.get(imageryId);
  if (imagery == null) return new LambdaHttpResponse(404, 'Not found');

  const targetPath = fsa.join(imagery.uri, requestType);

  try {
    const buf = await fsa.read(targetPath);
    const cacheKey = createHash('sha256').update(buf).digest('base64');

    if (TileEtag.isNotModified(req, cacheKey)) return NotModified;

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.ContentEncoding, 'gzip');
    response.buffer(await gzipP(buf), 'application/json');
    req.set('bytes', buf.byteLength);
    return response;
  } catch (e) {
    req.log.warn({ targetPath }, 'ImageryMetadata:Failed');
    return new LambdaHttpResponse(404, 'Not found');
  }
}
