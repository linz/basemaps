import { ConfigTileSetVector, TileSetNameComponents, TileSetNameParser, TileSetType } from '@basemaps/config';
import { GoogleTms, TileMatrixSet, VectorFormat } from '@basemaps/geo';
import { TileDataXyz } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { CotarCache } from './cotar.cache.js';
import { NotFound } from './routes/response.js';
import { TileSets } from './tile.set.cache.js';

export class TileSetVector {
  type: TileSetType.Vector = TileSetType.Vector;
  components: TileSetNameComponents;
  tileMatrix: TileMatrixSet;
  tileSet: ConfigTileSetVector;
  constructor(name: string, tileMatrix: TileMatrixSet) {
    this.components = TileSetNameParser.parse(name);
    this.tileMatrix = tileMatrix;
  }

  async init(record: ConfigTileSetVector): Promise<void> {
    this.tileSet = record;
  }

  /** What format does tile set use */
  get format(): VectorFormat {
    return VectorFormat.MapboxVectorTiles;
  }

  get id(): string {
    return TileSets.id(this.fullName, this.tileMatrix);
  }

  get fullName(): string {
    return TileSetNameParser.componentsToName(this.components);
  }

  async tile(req: LambdaHttpRequest, xyz: TileDataXyz): Promise<LambdaHttpResponse> {
    if (xyz.ext !== VectorFormat.MapboxVectorTiles) return NotFound;
    if (xyz.tileMatrix.identifier !== GoogleTms.identifier) return NotFound;
    if (this.tileSet.layers.length > 1) return new LambdaHttpResponse(500, 'Too many layers in tileset');
    const [layer] = this.tileSet.layers;
    if (layer[3857] == null) return new LambdaHttpResponse(500, 'Layer url not found from tileset Config');

    req.timer.start('cotar:load');
    const cotar = await CotarCache.get(layer[3857]);
    if (cotar == null) return new LambdaHttpResponse(500, 'Failed to load VectorTiles');
    req.timer.end('cotar:load');

    // Flip Y coordinate because MBTiles files are TMS.
    const y = (1 << xyz.z) - 1 - xyz.y;

    req.timer.start('cotar:tile');
    const tile = await cotar.get(`tiles/${xyz.z}/${xyz.x}/${y}.pbf.gz`);
    if (tile == null) return NotFound;
    req.timer.end('cotar:tile');

    const response = new LambdaHttpResponse(200, 'Ok');
    response.buffer(Buffer.from(tile), 'application/x-protobuf');
    response.header(HttpHeader.ContentEncoding, 'gzip');
    return response;
  }
}
