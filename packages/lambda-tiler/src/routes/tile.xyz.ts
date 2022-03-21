import { tileXyzFromPath } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { Router } from '../router.js';
import { TileSets } from '../tile.set.cache.js';
import { ValidateTilePath } from '../validate.js';
import { NotFound } from './response.js';

/**
 * Serve a tile
 *
 * /v1/tiles/:tileSet/:tileMatrixSet/:z/:x/:y.:tileType
 *
 * @example
 *  Vector Tile `/v1/tiles/topographic/EPSG:3857/2/1/1.pbf`
 *  Raster Tile `/v1/tiles/aerial/EPSG:3857/6/0/38.webp`
 * @returns
 */
export async function tileXyz(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const action = Router.action(req);
  const xyzData = tileXyzFromPath(action.rest);
  if (xyzData == null) return NotFound;
  ValidateTilePath.validate(req, xyzData);

  req.timer.start('tileset:load');
  const tileSet = await TileSets.get(xyzData.name, xyzData.tileMatrix);
  req.timer.end('tileset:load');
  if (tileSet == null) return NotFound;

  return await tileSet.tile(req, xyzData);
}
