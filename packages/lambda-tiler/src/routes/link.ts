import { TileSetType } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import { getPreviewUrl } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { ConfigLoader } from '../util/config.loader.js';

export interface LinkGet {
  Params: {
    tileSet: string;
  };
}

/**
 * Redirect the client to a Basemaps URL that is already zoomed to the extent of the tileset's imagery.
 *
 * /v1/link/:tileSet
 *
 * @example
 * '/v1/link/ashburton-2023-0.1m'
 *
 * @returns on success, 302 redirect response. on failure, 4xx status code response.
 */
export async function linkGet(req: LambdaHttpRequest<LinkGet>): Promise<LambdaHttpResponse> {
  const config = await ConfigLoader.load(req);

  // get tileset

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(req.params.tileSet);
  req.timer.end('tileset:load');

  if (tileSet == null) return new LambdaHttpResponse(404, 'Tileset not found');

  if (tileSet.type !== TileSetType.Raster) return new LambdaHttpResponse(400, 'Tileset must be raster type');

  // TODO: add support for 'aerial' and 'elevation' multi-layer tilesets
  if (tileSet.layers.length !== 1) return new LambdaHttpResponse(400, 'Too many layers');

  // get imagery

  const imageryId = tileSet.layers[0][Epsg.Google.code];
  if (imageryId === undefined) return new LambdaHttpResponse(400, "No imagery for '3857' projection");

  const imagery = await config.Imagery.get(imageryId);
  if (imagery == null) return new LambdaHttpResponse(400, 'Imagery not found');

  // do redirect

  const url = getPreviewUrl({ imagery });

  return new LambdaHttpResponse(302, 'Redirect to pre-zoomed imagery', {
    location: `/${url.slug}?i=${url.name}`,
  });
}
