import { ConfigTileSetRaster, Sources, StyleJson, TileSetType } from '@basemaps/config';
import { Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { URL } from 'url';
import { NotFound, NotModified } from '../util/response.js';
import { Validate } from '../util/validate.js';
import { Etag } from '../util/etag.js';
import { ConfigLoader } from '../util/config.loader.js';
import { GoogleTms, ImageFormat, TileMatrixSets } from '@basemaps/geo';

/**
 * Convert relative URLS into a full hostname url
 * @param url possible url to update
 * @param apiKey ApiKey to append with ?api= if required
 * @returns Updated Url or empty string if url is empty
 */
export function convertRelativeUrl(url?: string, apiKey?: string): string {
  if (url == null) return '';
  const host = Env.get(Env.PublicUrlBase) ?? '';
  if (!url.startsWith('/')) return url; // Not relative ignore
  const fullUrl = new URL(fsa.join(host, url));
  if (apiKey) fullUrl.searchParams.set('api', apiKey);
  return fullUrl.toString().replace(/%7B/g, '{').replace(/%7D/g, '}');
}

/**
 * Create a new style json that has absolute urls to the current host and  API Keys where required
 * @param style style to update
 * @param apiKey api key to inject
 * @returns new stylejson
 */
export function convertStyleJson(style: StyleJson, apiKey: string): StyleJson {
  const sources: Sources = JSON.parse(JSON.stringify(style.sources));
  for (const [key, value] of Object.entries(sources)) {
    if (value.type === 'vector') {
      value.url = convertRelativeUrl(value.url, apiKey);
    } else if (value.type === 'raster' && Array.isArray(value.tiles)) {
      for (let i = 0; i < value.tiles.length; i++) {
        value.tiles[i] = convertRelativeUrl(value.tiles[i], apiKey);
      }
    }
    sources[key] = value;
  }

  return {
    version: 8,
    id: style.id,
    name: style.name,
    sources,
    layers: style.layers,
    metadata: style.metadata ?? {},
    glyphs: convertRelativeUrl(style.glyphs),
    sprite: convertRelativeUrl(style.sprite),
  } as StyleJson;
}

export interface StyleGet {
  Params: {
    styleName: string;
  };
}

export async function tileSetToStyle(
  req: LambdaHttpRequest<StyleGet>,
  tileSet: ConfigTileSetRaster,
  apiKey: string,
): Promise<LambdaHttpResponse> {
  const tileMatrix = TileMatrixSets.find(req.query.get('tileMatrix') ?? GoogleTms.identifier);
  if (tileMatrix == null) return new LambdaHttpResponse(400, 'Invalid tile matrix');
  const [tileFormat] = Validate.getRequestedFormats(req) ?? [ImageFormat.Webp];
  if (tileFormat == null) return new LambdaHttpResponse(400, 'Invalid image format');

  const urlQuery = new URLSearchParams();
  const configLocation = req.query.get('config');
  urlQuery.append('api', apiKey);
  if (configLocation) urlQuery.append('config', configLocation);

  const tileUrl = fsa.join(
    Env.get(Env.PublicUrlBase) ?? '',
    `/v1/tiles/${tileSet.name}/${tileMatrix.identifier}/{z}/{x}/{y}.${tileFormat}?${urlQuery.toString()}`,
  );
  const styleId = `basemaps-${tileSet.name}`;
  const style = {
    version: 8,
    sources: { [styleId]: { type: 'raster', tiles: [tileUrl], tileSize: 256 } },
    layers: [{ id: styleId, type: 'raster', source: styleId }],
  };
  const data = Buffer.from(JSON.stringify(style));

  const cacheKey = Etag.key(data);
  if (Etag.isNotModified(req, cacheKey)) return NotModified();

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}

export async function styleJsonGet(req: LambdaHttpRequest<StyleGet>): Promise<LambdaHttpResponse> {
  const apiKey = Validate.apiKey(req);
  const styleName = req.params.styleName;

  // Get style Config from db
  const config = await ConfigLoader.load(req);
  const dbId = config.Style.id(styleName);
  const styleConfig = await config.Style.get(dbId);
  if (styleConfig == null) {
    // Were we given a tileset name instead, generat
    const tileSet = await config.TileSet.get(config.TileSet.id(styleName));
    if (tileSet == null) return NotFound();
    if (tileSet.type !== TileSetType.Raster) return NotFound();
    return tileSetToStyle(req, tileSet, apiKey);
  }

  // Prepare sources and add linz source
  const style = convertStyleJson(styleConfig.style, apiKey);
  const data = Buffer.from(JSON.stringify(style));

  const cacheKey = Etag.key(data);
  if (Etag.isNotModified(req, cacheKey)) return NotModified();

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}
