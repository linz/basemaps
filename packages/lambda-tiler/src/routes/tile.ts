import { Sources, StyleJson } from '@basemaps/config';
import { TileMatrixSet } from '@basemaps/geo';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { Config, Env, setNameAndProjection, TileSetName, tileWmtsFromPath, tileXyzFromPath } from '@basemaps/shared';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { createHash } from 'crypto';
import { isValidApiKey } from '../api.key.js';
import { TileSets } from '../tile.set.cache.js';
import { TileSetRaster } from '../tile.set.raster.js';
import { WmtsCapabilities } from '../wmts.capability.js';
import { attribution } from './attribution.js';
import { TileEtag } from './tile.etag.js';
import { Router } from '../router.js';
import { ValidateTilePath } from '../validate.js';
import { URL } from 'url';
import { fsa } from '@chunkd/fs';

export const TileComposer = new TileMakerSharp(256);

export const NotFound = new LambdaHttpResponse(404, 'Not Found');
export const NotModified = new LambdaHttpResponse(304, 'Not modified');

export interface TileJson {
  tiles: string[];
  minzoom: number;
  maxzoom: number;
  format: string;
  tilejson: string;
}

export const TileRoute = {
  async tile(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    const action = Router.action(req);
    const xyzData = tileXyzFromPath(action.rest);
    if (xyzData == null) return NotFound;
    ValidateTilePath.validate(req, xyzData);

    req.timer.start('tileset:load');
    const tileSet = await TileSets.get(xyzData.name, xyzData.tileMatrix);
    req.timer.end('tileset:load');
    if (tileSet == null) return NotFound;

    const res = await tileSet.tile(req, xyzData);
    return res;
  },

  async wmtsLoadTileSets(name: string, tileMatrix: TileMatrixSet | null): Promise<TileSetRaster[]> {
    if (tileMatrix != null) {
      const ts = await TileSets.get(name, tileMatrix);
      if (ts == null || ts.isVector()) return [];
      return [ts];
    }
    if (name === '') name = TileSetName.aerial;
    return (await TileSets.getAll(name, tileMatrix)).filter((f) => f.type === 'raster') as TileSetRaster[];
  },

  async wmts(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    const action = Router.action(req);
    const wmtsData = tileWmtsFromPath(action.rest);
    if (wmtsData == null) return NotFound;
    setNameAndProjection(req, wmtsData);
    const host = Env.get(Env.PublicUrlBase) ?? '';

    req.timer.start('tileset:load');
    const tileSets = await TileRoute.wmtsLoadTileSets(wmtsData.name, wmtsData.tileMatrix);
    req.timer.end('tileset:load');
    if (tileSets.length === 0) return NotFound;

    const providerId = Config.Provider.id('linz');
    const provider = await Config.Provider.get(providerId);
    if (provider == null) return NotFound;

    const apiKey = Router.apiKey(req);
    const xml = WmtsCapabilities.toXml(host, provider, tileSets, apiKey);
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
  },

  async tileJson(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    const { version, rest, name } = Router.action(req);
    const apiKey = Router.apiKey(req);
    const host = Env.get(Env.PublicUrlBase) ?? '';
    const tileUrl = `${host}/${version}/${name}/${rest[0]}/${rest[1]}/{z}/{x}/{y}.pbf?api=${apiKey}`;

    const tileJson: TileJson = {
      tiles: [tileUrl],
      minzoom: 0,
      maxzoom: 15,
      format: 'pbf',
      tilejson: '2.0.0',
    };

    const json = JSON.stringify(tileJson);

    const data = Buffer.from(json);

    const cacheKey = createHash('sha256').update(data).digest('base64');

    if (TileEtag.isNotModified(req, cacheKey)) return NotModified;

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'max-age=120');
    response.buffer(data, 'application/json');
    req.set('bytes', data.byteLength);
    return response;
  },

  async styleJson(req: LambdaHttpRequest, fileName: string): Promise<LambdaHttpResponse> {
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
  },
};
export async function Tiles(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const { rest } = Router.action(req);
  if (rest.length < 1) return NotFound;
  const apiKey = Router.apiKey(req);
  if (!isValidApiKey(apiKey)) return new LambdaHttpResponse(400, 'Invalid API Key');

  const fileName = rest[rest.length - 1].toLowerCase();
  if (fileName === 'attribution.json') return attribution(req);
  if (fileName === 'wmtscapabilities.xml') return TileRoute.wmts(req);
  if (fileName === 'tile.json') return TileRoute.tileJson(req);
  if (fileName.endsWith('json') && rest[rest.length - 2] === 'style') return TileRoute.styleJson(req, fileName);
  return TileRoute.tile(req);
}
