import { Config, TileSetType } from '@basemaps/config';
import { GoogleTms, ImageFormat, Nztm2000QuadTms } from '@basemaps/geo';
import { Env, tileWmtsFromPath } from '@basemaps/shared';
import { getImageFormat } from '@basemaps/tiler';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { Router } from '../router.js';
import { WmtsCapabilities } from '../wmts.capability.js';
import { NotFound, NotModified } from './response.js';
import { TileEtag } from './tile.etag.js';

export function getImageFormats(req: LambdaHttpRequest): ImageFormat[] | undefined {
  const formats = req.query.getAll('format');
  if (formats == null || formats.length === 0) return undefined;

  const output: Set<ImageFormat> = new Set();
  for (const fmt of formats) {
    const parsed = getImageFormat(fmt);
    if (parsed == null) continue;
    output.add(parsed);
  }
  if (output.size === 0) return undefined;
  return [...output.values()];
}

/**
 * Serve a WMTS request
 *
 * /v1/tiles/:tileSet/:tileMatrixSet/WMTSCapabilities.xml
 * @example `/v1/tiles/aerial/NZTM2000Quad/WMTSCapabilities.xml`
 */
export async function wmts(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const action = Router.action(req);
  const wmtsData = tileWmtsFromPath(action.rest);
  if (wmtsData == null) return NotFound;
  const host = Env.get(Env.PublicUrlBase) ?? '';

  req.timer.start('tileset:load');
  const tileSet = await Config.TileSet.get(Config.TileSet.id(wmtsData.name ?? 'aerial'));
  req.timer.end('tileset:load');
  if (tileSet == null || tileSet.type !== TileSetType.Raster) return NotFound;

  const providerId = Config.Provider.id('linz');
  const provider = await Config.Provider.get(providerId);

  const tileMatrix = wmtsData.tileMatrix == null ? [GoogleTms, Nztm2000QuadTms] : [wmtsData.tileMatrix];
  req.timer.start('imagery:load');
  const imagery = await Config.getAllImagery(
    tileSet.layers,
    tileMatrix.map((tms) => tms.projection),
  );
  req.timer.end('imagery:load');

  const apiKey = Router.apiKey(req);
  const xml = new WmtsCapabilities({
    httpBase: host,
    provider: provider ?? undefined,
    tileSet,
    tileMatrix,
    isIndividualLayers: wmtsData.tileMatrix == null,
    imagery,
    apiKey,
    formats: getImageFormats(req),
  }).toXml();
  if (xml == null) return NotFound;

  const data = Buffer.from(xml);

  const cacheKey = createHash('sha256').update(data).digest('base64');
  if (TileEtag.isNotModified(req, cacheKey)) return NotModified;

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'max-age=0');
  response.buffer(data, 'text/xml');
  req.set('bytes', data.byteLength);
  return response;
}
