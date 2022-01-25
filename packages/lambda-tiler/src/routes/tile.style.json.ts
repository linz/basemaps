import { Sources, StyleJson } from '@basemaps/config';
import { Config, Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { URL } from 'url';
import { Router } from '../router.js';
import { NotFound, NotModified } from './response.js';
import { TileEtag } from './tile.etag.js';

export async function styleJson(req: LambdaHttpRequest, fileName: string): Promise<LambdaHttpResponse> {
  const apiKey = Router.apiKey(req);
  if (apiKey == null) return new LambdaHttpResponse(400, 'Invalid API Key.');
  const styleName = fileName.split('.json')[0];
  const host = Env.get(Env.PublicUrlBase) ?? '';

  // Get style Config from db
  const dbId = Config.Style.id(styleName);
  const styleConfig = await Config.Style.get(dbId);
  if (styleConfig == null) return NotFound;

  // Prepare sources and add linz source
  const style = styleConfig.style;
  const sources: Sources = {};
  for (const [key, value] of Object.entries(style.sources)) {
    if (value.type === 'vector') {
      if (value.url.startsWith('/')) {
        const url = new URL(fsa.join(host, value.url));
        url.searchParams.set('api', apiKey);
        value.url = url.toString().replace(/%7B/g, '{').replace(/%7D/g, '}');
      }
    } else if (value.type === 'raster' && Array.isArray(value.tiles)) {
      for (let i = 0; i < value.tiles.length; i++) {
        const tile = value.tiles[i];
        if (tile.startsWith('/')) {
          const url = new URL(fsa.join(host, tile));
          url.searchParams.set('api', apiKey);
          value.tiles[i] = url.toString().replace(/%7B/g, '{').replace(/%7D/g, '}');
        }
      }
    }
    sources[key] = value;
  }

  // prepare Style.json
  const styleJson: StyleJson = {
    /** Style.json version 8 */
    version: 8,
    id: style.id,
    name: style.name,
    sources,
    layers: style.layers,
    metadata: style.metadata || {},
    glyphs: style.glyphs || '',
    sprite: style.sprite || '',
  };

  const json = JSON.stringify(styleJson);

  const data = Buffer.from(json);

  const cacheKey = createHash('sha256').update(data).digest('base64');

  if (TileEtag.isNotModified(req, cacheKey)) return NotModified;

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}
