import { ConfigTileSetRaster, Layer, Sources, StyleJson, TileSetType } from '@basemaps/config';
import { GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { Env, toQueryString } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { URL } from 'url';

import { ConfigLoader } from '../util/config.loader.js';
import { Etag } from '../util/etag.js';
import { getFilters } from '../util/filter.js';
import { NotFound, NotModified } from '../util/response.js';
import { Validate } from '../util/validate.js';

/**
 * Convert relative URLS into a full hostname url
 * @param url possible url to update
 * @param apiKey ApiKey to append with ?api= if required
 * @returns Updated Url or empty string if url is empty
 */
export function convertRelativeUrl(url?: string, apiKey?: string, config?: string | null): string {
  if (url == null) return '';
  const host = Env.get(Env.PublicUrlBase) ?? '';
  if (!url.startsWith('/')) return url; // Not relative ignore
  const fullUrl = new URL(url, host);
  if (apiKey) fullUrl.searchParams.set('api', apiKey);
  if (config) fullUrl.searchParams.set('config', config);
  return fullUrl.toString().replace(/%7B/g, '{').replace(/%7D/g, '}');
}

/**
 * Create a new style json that has absolute urls to the current host and  API Keys where required
 * @param style style to update
 * @param apiKey api key to inject
 * @returns new stylejson
 */
export function convertStyleJson(style: StyleJson, apiKey: string, config: string | null, layers?: Layer[]): StyleJson {
  const sources: Sources = JSON.parse(JSON.stringify(style.sources));
  for (const [key, value] of Object.entries(sources)) {
    if (value.type === 'vector') {
      value.url = convertRelativeUrl(value.url, apiKey, config);
    } else if (value.type === 'raster' && Array.isArray(value.tiles)) {
      for (let i = 0; i < value.tiles.length; i++) {
        value.tiles[i] = convertRelativeUrl(value.tiles[i], apiKey, config);
      }
    }
    sources[key] = value;
  }

  return {
    version: 8,
    id: style.id,
    name: style.name,
    sources,
    layers: layers ? layers : style.layers,
    metadata: style.metadata ?? {},
    glyphs: convertRelativeUrl(style.glyphs, undefined, config),
    sprite: convertRelativeUrl(style.sprite, undefined, config),
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
  const [tileFormat] = Validate.getRequestedFormats(req) ?? ['webp'];
  if (tileFormat == null) return new LambdaHttpResponse(400, 'Invalid image format');

  const pipeline = Validate.pipeline(tileSet, tileFormat, req.query.get('pipeline'));

  const configLocation = ConfigLoader.extract(req);
  const query = toQueryString({ config: configLocation, api: apiKey, ...getFilters(req), pipeline: pipeline?.name });

  const tileUrl =
    (Env.get(Env.PublicUrlBase) ?? '') +
    `/v1/tiles/${tileSet.name}/${tileMatrix.identifier}/{z}/{x}/{y}.${tileFormat}${query}`;

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
  const excludeLayers = req.query.getAll('exclude');
  const excluded = new Set(excludeLayers.map((l) => l.toLowerCase()));

  // Get style Config from db
  const config = await ConfigLoader.load(req);
  const dbId = config.Style.id(styleName);
  const styleConfig = await config.Style.get(dbId);
  if (styleConfig == null) {
    // Were we given a tileset name instead, generated
    const tileSet = await config.TileSet.get(config.TileSet.id(styleName));
    if (tileSet == null) return NotFound();
    if (tileSet.type !== TileSetType.Raster) return NotFound();
    return tileSetToStyle(req, tileSet, apiKey);
  }

  // Prepare sources and add linz source
  const style = convertStyleJson(
    styleConfig.style,
    apiKey,
    ConfigLoader.extract(req),
    styleConfig.style.layers.filter((f) => !excluded.has(f.id.toLowerCase())),
  );
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
