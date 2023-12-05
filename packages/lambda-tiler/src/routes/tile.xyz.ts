import { TileSetType } from '@basemaps/config';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { ConfigLoader } from '../util/config.loader.js';
import { NotFound } from '../util/response.js';
import { Validate } from '../util/validate.js';
import { TileXyzRaster } from './tile.xyz.raster.js';
import { tileXyzVector } from './tile.xyz.vector.js';

export interface TileXyzGet {
  Params: {
    tileSet: string;
    tileMatrix: string;
    z: string;
    x: string;
    y: string;
    tileType: string;
  };
}

/**
 * Serve a tile
 *
 * /v1/tiles/:tileSet/:tileMatrixSet/:z/:x/:y.:tileType
 *
 * @example
 *  Vector Tile `/v1/tiles/topographic/WebMercatorQuad/2/1/1.pbf`
 *  Raster Tile `/v1/tiles/aerial/WebMercatorQuad/6/0/38.webp`
 *
 */
export async function tileXyzGet(req: LambdaHttpRequest<TileXyzGet>): Promise<LambdaHttpResponse> {
  const xyzData = Validate.xyz(req);

  const config = await ConfigLoader.load(req);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(xyzData.tileSet));
  req.timer.end('tileset:load');
  if (tileSet == null) return NotFound();

  switch (tileSet.type) {
    case TileSetType.Vector:
      return tileXyzVector.tile(req, tileSet, xyzData);
    case TileSetType.Raster:
      return TileXyzRaster.tile(req, tileSet, xyzData);
    default:
      return new LambdaHttpResponse(400, 'Invalid tileset');
  }
}
