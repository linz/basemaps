import { ConfigTileSetComputed } from '@basemaps/config/src/config/tile.set.js';
import { Tiler } from '@basemaps/tiler';
import { TileComputerSharp } from '@basemaps/tiler-sharp';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { Etag } from '../util/etag.js';
import { NotFound, NotModified } from '../util/response.js';
import { TileXyz } from '../util/validate.js';
import { TileXyzRaster } from './tile.xyz.raster.js';

const tileComputer = new TileComputerSharp(256);
export const TileXyzComputed = {
  async tile(req: LambdaHttpRequest, tileSet: ConfigTileSetComputed, xyz: TileXyz): Promise<LambdaHttpResponse> {
    const pipeline = tileSet.outputs.find((f) => f.extension === xyz.tileType);
    if (pipeline == null) return NotFound('Invalid output format:' + xyz.tileType);

    const assetPaths = await TileXyzRaster.getAssetsForTile(req, tileSet, xyz);
    const cacheKey = Etag.key(assetPaths);
    if (Etag.isNotModified(req, cacheKey)) return NotModified();

    const assets = await TileXyzRaster.loadAssets(req, assetPaths);

    const tiler = new Tiler(xyz.tileMatrix);
    const layers = await tiler.tile(assets, xyz.tile.x, xyz.tile.y, xyz.tile.z);

    const res = await tileComputer.compute({
      layers,
      pipeline,
      metrics: req.timer,
    });

    req.set('layersUsed', res.layers);
    req.set('bytes', res.buffer.byteLength);

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    response.buffer(res.buffer, 'image/' + pipeline.output.type);
    return response;
  },
};
