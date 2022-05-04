import { GoogleTms, TileJson, TileMatrixSet } from '@basemaps/geo';
import { Env, extractTileMatrixSet } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { Router } from '../router.js';
import { TileSets } from '../tile.set.cache.js';
import { getTileMatrixId } from '../wmts.capability.js';
import { NotFound, NotModified } from './response.js';
import { TileEtag } from './tile.etag.js';

export async function tileJson(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const { version, rest, name } = Router.action(req);
  if (rest.length !== 3) return NotFound;

  const tileMatrix = extractTileMatrixSet(rest[1]);
  if (tileMatrix == null) return NotFound;

  req.timer.start('tileset:load');
  const tileSet = await TileSets.get(rest[0], tileMatrix);
  req.timer.end('tileset:load');
  if (tileSet == null) return NotFound;

  const apiKey = Router.apiKey(req);
  const host = Env.get(Env.PublicUrlBase) ?? '';

  const tileUrl =
    [host, version, name, tileSet.fullName, getTileMatrixId(tileMatrix), '{z}', '{x}', '{y}'].join('/') +
    `.${tileSet.format}?api=${apiKey}`;

  const tileJson: TileJson = {
    tiles: [tileUrl],
    vector_layers: [],
    tilejson: '3.0.0',
  };
  const maxZoom = TileMatrixSet.convertZoomLevel(tileSet.tileSet.maxZoom ?? 30, GoogleTms, tileMatrix, true);
  const minZoom = TileMatrixSet.convertZoomLevel(tileSet.tileSet.minZoom ?? 0, GoogleTms, tileMatrix, true);

  if (tileSet.tileSet.maxZoom) tileJson.maxzoom = maxZoom;
  if (tileSet.tileSet.minZoom) tileJson.minzoom = minZoom;

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
}
