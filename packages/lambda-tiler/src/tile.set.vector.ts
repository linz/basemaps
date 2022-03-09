import { ConfigTileSetVector, TileSetType } from '@basemaps/config';
import { fsa, TileDataXyz, VectorFormat } from '@basemaps/shared';
import { Cotar } from '@cotar/core';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { NotFound } from './routes/response.js';
import { St } from './source.tracer.js';
import { TileSetHandler } from './tile.set.js';

class CotarCache {
  cache = new Map<string, Promise<Cotar | null>>();

  get(uri: string): Promise<Cotar | null> {
    let cotar = this.cache.get(uri);
    if (cotar == null) {
      const source = fsa.source(uri);
      St.trace(source);
      cotar = Cotar.fromTar(source);
      this.cache.set(uri, cotar);
    }
    return cotar;
  }
}

export const Layers = new CotarCache();

export class TileSetVector extends TileSetHandler<ConfigTileSetVector> {
  type = TileSetType.Vector;

  async tile(req: LambdaHttpRequest, xyz: TileDataXyz): Promise<LambdaHttpResponse> {
    if (xyz.ext !== VectorFormat.MapboxVectorTiles) return NotFound;
    if (this.tileSet.layers.length > 1) return new LambdaHttpResponse(500, 'Too many layers in tileset');
    const [layer] = this.tileSet.layers;
    if (layer[3857] == null) return new LambdaHttpResponse(500, 'Layer url not found from tileset Config');

    req.timer.start('cotar:load');
    const cotar = await Layers.get(layer[3857]);
    if (cotar == null) return new LambdaHttpResponse(500, 'Failed to load VectorTiles');
    req.timer.end('cotar:load');

    // Flip Y coordinate because MBTiles files are TMS.
    const y = (1 << xyz.z) - 1 - xyz.y;

    req.timer.start('cotar:tile');
    const tile = await cotar.get(`tiles/${xyz.z}/${xyz.x}/${y}.pbf.gz`, req.log);
    if (tile == null) return NotFound;
    req.timer.end('cotar:tile');

    const response = new LambdaHttpResponse(200, 'Ok');
    response.buffer(Buffer.from(tile), 'application/x-protobuf');
    response.header(HttpHeader.ContentEncoding, 'gzip');
    return response;
  }
}
