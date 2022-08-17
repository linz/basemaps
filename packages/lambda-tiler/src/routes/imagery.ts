import { fsa } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { promisify } from 'util';
import { gzip } from 'zlib';
import { ConfigLoader } from '../util/config.loader.js';
import { isGzip } from '../util/cotar.serve.js';
import { Etag } from '../util/etag.js';
import { NotFound, NotModified } from '../util/response.js';

const gzipP = promisify(gzip);

export function isAllowedFile(f: string): boolean {
  if (f == null) return false;
  if (f.endsWith('.geojson')) return true;
  if (f.endsWith('.json')) return true;
  return false;
}

interface ImageryGet {
  Params: { imageryId: string; fileName: string };
}

/**
 * Get metadata around the imagery such as the source bounding box or the bounding box of the COGS
 *
 * @example
 * - /v1/imagery/:imageryId/source.geojson - Source boudning boxes
 * - /v1/imagery/:imageryId/covering.geojson - Output tile bounding boxes
 * - /v1/imagery/:imageryId/cutline.geojson - Cutline used ont he imagery set
 * - /v1/imagery/:imageryId/collection.json - STAC Collection
 * - /v1/imagery/:imageryId/15-32659-21603.json - STAC Item
 */
export async function imageryGet(req: LambdaHttpRequest<ImageryGet>): Promise<LambdaHttpResponse> {
  const requestedFile = req.params.fileName;
  if (!isAllowedFile(requestedFile)) return NotFound();

  const config = await ConfigLoader.load(req);
  const imagery = await config.Imagery.get(config.Imagery.id(req.params.imageryId));
  if (imagery == null) return NotFound();

  const targetPath = fsa.join(imagery.uri, requestedFile);

  try {
    const buf = await fsa.read(targetPath);

    const cacheKey = Etag.key(buf);
    if (Etag.isNotModified(req, cacheKey)) return NotModified();

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.ContentEncoding, 'gzip');
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    response.buffer(isGzip(buf) ? buf : await gzipP(buf), 'application/json');
    req.set('bytes', buf.byteLength);
    return response;
  } catch (e) {
    req.log.warn({ targetPath }, 'ImageryMetadata:Failed');
    return NotFound();
  }
}
