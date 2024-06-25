import { standardizeLayerName } from '@basemaps/config';
import { GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { ConfigLoader } from '../util/config.loader.js';
import { Etag } from '../util/etag.js';
import { NotFound, NotModified } from '../util/response.js';

function sendJson(req: LambdaHttpRequest, toSend: unknown): LambdaHttpResponse {
  const data = Buffer.from(JSON.stringify(toSend));

  const cacheKey = Etag.key(data);
  if (Etag.isNotModified(req, cacheKey)) return NotModified();

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}

interface ConfigTileSetGet {
  Params: {
    tileSet: string;
  };
}

export async function configTileSetGet(req: LambdaHttpRequest<ConfigTileSetGet>): Promise<LambdaHttpResponse> {
  const config = await ConfigLoader.load(req);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(req.params.tileSet));
  req.timer.end('tileset:load');
  if (tileSet == null) return NotFound();

  return sendJson(req, tileSet);
}

interface ConfigImageryGet {
  Params: {
    tileSet: string;
    imageryId: string;
  };
}

/**
 * Load the imagery configuration by either name or id
 *
 * @param req
 * @returns
 */
export async function configImageryGet(req: LambdaHttpRequest<ConfigImageryGet>): Promise<LambdaHttpResponse> {
  const config = await ConfigLoader.load(req);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(req.params.tileSet));
  req.timer.end('tileset:load');
  if (tileSet == null) return NotFound();

  req.timer.start('imagery:load');
  let imagery = await config.Imagery.get(config.Imagery.id(req.params.imageryId));
  req.timer.end('imagery:load');

  if (imagery == null) {
    const imageryLayer = tileSet.layers.find(
      (f) => f.name === req.params.imageryId || standardizeLayerName(f.name) === req.params.imageryId,
    );
    if (imageryLayer == null) return NotFound();

    const tileMatrix = TileMatrixSets.find(req.query.get('tileMatrix') ?? GoogleTms.identifier);
    if (tileMatrix == null) return NotFound();

    const imageryId = imageryLayer[tileMatrix.projection.code];
    if (imageryId == null) return NotFound();

    req.timer.start('imagery:load:sub');
    imagery = await config.Imagery.get(config.Imagery.id(imageryId));
    req.timer.end('imagery:load:sub');
  }

  if (imagery == null) return NotFound();
  return sendJson(req, imagery);
}
