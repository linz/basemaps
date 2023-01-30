import { GoogleTms, TileJson, TileMatrixSet } from '@basemaps/geo';
import { Env, toQueryString } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { ConfigLoader } from '../util/config.loader.js';
import { getFilters } from '../util/filter.js';
import { NotFound } from '../util/response.js';
import { Validate } from '../util/validate.js';

export interface TileJsonGet {
  Params: {
    tileSet: string;
    tileMatrix: string;
  };
}

export async function tileJsonGet(req: LambdaHttpRequest<TileJsonGet>): Promise<LambdaHttpResponse> {
  const tileMatrix = Validate.getTileMatrixSet(req.params.tileMatrix);
  if (tileMatrix == null) return NotFound();

  const apiKey = Validate.apiKey(req);

  const config = await ConfigLoader.load(req);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(req.params.tileSet));
  req.timer.end('tileset:load');
  if (tileSet == null) return NotFound();

  const format = Validate.getRequestedFormats(req) ?? [tileSet.format];

  const host = Env.get(Env.PublicUrlBase) ?? '';

  const configLocation = ConfigLoader.extract(req);

  const query = toQueryString({ api: apiKey, config: configLocation, ...getFilters(req) });

  const tileUrl =
    [host, 'v1', 'tiles', tileSet.name, tileMatrix.identifier, '{z}', '{x}', '{y}'].join('/') + `.${format[0]}${query}`;

  const tileJson: TileJson = { tiles: [tileUrl], tilejson: '3.0.0' };
  const maxZoom = TileMatrixSet.convertZoomLevel(tileSet.maxZoom ?? 30, GoogleTms, tileMatrix, true);
  const minZoom = TileMatrixSet.convertZoomLevel(tileSet.minZoom ?? 0, GoogleTms, tileMatrix, true);

  if (tileSet.maxZoom) tileJson.maxzoom = maxZoom;
  if (tileSet.minZoom) tileJson.minzoom = minZoom;

  const json = JSON.stringify(tileJson);
  const data = Buffer.from(json);

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}
