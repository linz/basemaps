import { Sources, StyleJson } from '@basemaps/config';
import { Config, Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { URL } from 'url';
import { Router } from '../router.js';
import { NotFound, NotModified } from './response.js';
import { TileEtag } from './tile.etag.js';

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

export async function styleJson(req: LambdaHttpRequest, fileName: string): Promise<LambdaHttpResponse> {
  const apiKey = Router.apiKey(req);
  if (apiKey == null) return new LambdaHttpResponse(400, 'Invalid API Key.');
  const styleName = fileName.split('.json')[0];

  // Get style Config from db
  const dbId = Config.Style.id(styleName);
  const styleConfig = await Config.Style.get(dbId);
  if (styleConfig == null) return NotFound;

  // Prepare sources and add linz source
  const style = convertStyleJson(styleConfig.style, apiKey);
  const data = Buffer.from(JSON.stringify(style));

  const cacheKey = createHash('sha256').update(data).digest('base64');

  if (TileEtag.isNotModified(req, cacheKey)) return NotModified;

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}
