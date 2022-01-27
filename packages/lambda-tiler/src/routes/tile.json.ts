import { Env } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { createHash } from 'crypto';
import { Router } from '../router.js';
import { NotModified } from './response.js';
import { TileEtag } from './tile.etag.js';

export interface TileJson {
  tiles: string[];
  minzoom: number;
  maxzoom: number;
  format: string;
  tilejson: string;
}

export async function tileJson(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
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
}
