import { getAllImagery, TileSetType } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms, TileMatrixSet } from '@basemaps/geo';
import { Env } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { createHash } from 'crypto';

import { ConfigLoader } from '../util/config.loader.js';
import { Etag } from '../util/etag.js';
import { NotFound, NotModified } from '../util/response.js';
import { Validate } from '../util/validate.js';
import { WmtsCapabilities } from '../wmts.capability.js';

export interface WmtsCapabilitiesGet {
  Params: {
    tileSet?: string;
    tileMatrix?: string;
  };
}

export function getWmtsTileMatrix(tileMatrixParam?: string): TileMatrixSet[] | null {
  if (tileMatrixParam == null) return [GoogleTms, Nztm2000QuadTms];
  const tileMatrix = Validate.getTileMatrixSet(tileMatrixParam);
  if (tileMatrix == null) return null;
  return [tileMatrix];
}
/**
 * Serve a WMTS request
 *
 * /v1/tiles/:tileSet/:tileMatrixSet/WMTSCapabilities.xml
 * @example `/v1/tiles/aerial/NZTM2000Quad/WMTSCapabilities.xml`
 */
export async function wmtsCapabilitiesGet(req: LambdaHttpRequest<WmtsCapabilitiesGet>): Promise<LambdaHttpResponse> {
  const apiKey = Validate.apiKey(req);

  const tileSetName = req.params.tileSet ?? 'aerial';
  const tileMatrix = getWmtsTileMatrix(req.params.tileMatrix);
  if (tileMatrix == null) return NotFound();

  const host = Env.get(Env.PublicUrlBase) ?? '';

  const config = await ConfigLoader.load(req);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(tileSetName ?? 'aerial'));
  req.timer.end('tileset:load');
  if (tileSet == null || tileSet.type !== TileSetType.Raster) return NotFound('Tileset not found');

  const provider = await config.Provider.get(config.Provider.id('linz'));

  req.timer.start('imagery:load');
  const imagery = await getAllImagery(
    config,
    tileSet.layers,
    tileMatrix.map((tms) => tms.projection),
  );
  req.timer.end('imagery:load');
  if (imagery.size === 0) return NotFound('No layers found for tile set: ' + tileSet.id);

  const wmts = new WmtsCapabilities({
    httpBase: host,
    apiKey,
    config: ConfigLoader.extract(req),
  });

  wmts.fromParams({
    provider: provider ?? undefined,
    tileSet,
    tileMatrix,
    imagery,
    formats: Validate.getRequestedFormats(req) ?? [],
    layers: req.params.tileMatrix == null ? tileSet.layers : undefined,
    pipeline: req.query.get('pipeline'),
  });

  const xml = wmts.toXml();
  if (xml == null) return NotFound();

  const data = Buffer.from(xml);

  const cacheKey = createHash('sha256').update(data).digest('base64');
  if (Etag.isNotModified(req, cacheKey)) return NotModified();

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'text/xml');
  req.set('bytes', data.byteLength);
  return response;
}
