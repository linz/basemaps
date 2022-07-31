import { ConfigTileSetVector } from '@basemaps/config';
import { GoogleTms, VectorFormat } from '@basemaps/geo';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { isGzip } from '../util/cotar.serve.js';
import { Etag } from '../util/etag.js';
import { NonContent, NotFound, NotModified } from '../util/response.js';
import { CoSources } from '../util/source.cache.js';
import { TileXyz } from '../util/validate.js';

export const tileXyzVector = {
  /** Serve a MVT vector tile */
  async tile(req: LambdaHttpRequest, tileSet: ConfigTileSetVector, xyz: TileXyz): Promise<LambdaHttpResponse> {
    if (xyz.tileType !== VectorFormat.MapboxVectorTiles) return NotFound();
    if (xyz.tileMatrix.identifier !== GoogleTms.identifier) return NotFound();

    if (tileSet.layers.length > 1) return new LambdaHttpResponse(500, 'Too many layers in tileset');
    const [layer] = tileSet.layers;
    const layerId = layer[3857];
    if (layerId == null) return new LambdaHttpResponse(500, 'Layer url not found from tileset Config');

    // Flip Y coordinate because MBTiles files are TMS.
    const y = (1 << xyz.tile.z) - 1 - xyz.tile.y;

    const tilePath = `tiles/${xyz.tile.z}/${xyz.tile.x}/${y}.pbf.gz`;
    const tileId = `${layerId}#${tilePath}`;

    const cacheKey = Etag.key(tileId);
    if (Etag.isNotModified(req, cacheKey)) return NotModified();

    req.timer.start('cotar:load');
    const cotar = await CoSources.getCotar(layerId);
    if (cotar == null) return new LambdaHttpResponse(500, 'Failed to load VectorTiles');
    req.timer.end('cotar:load');

    req.timer.start('cotar:tile');
    const tile = await cotar.get(tilePath);
    if (tile == null) return NonContent();
    req.timer.end('cotar:tile');

    const tileBuffer = Buffer.from(tile);
    const response = LambdaHttpResponse.ok().buffer(tileBuffer, 'application/x-protobuf');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    if (isGzip(tileBuffer)) response.header(HttpHeader.ContentEncoding, 'gzip');
    return response;
  },
};
