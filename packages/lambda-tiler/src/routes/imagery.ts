import { Config } from '@basemaps/config';
import { fsa } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { promisify } from 'util';
import { gzip } from 'zlib';
import { NotModified } from './response.js';
import { TileEtag } from './tile.etag.js';

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
  if (!isAllowedFile(requestedFile)) return new LambdaHttpResponse(404, 'Not found');

  const imagery = await Config.Imagery.get(Config.Imagery.id(req.params.imageryId));
  if (imagery == null) return new LambdaHttpResponse(404, 'Not found');

  const targetPath = fsa.join(imagery.uri, requestedFile);

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
