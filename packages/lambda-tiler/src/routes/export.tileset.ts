import { signS3Get } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { ConfigLoader } from '../util/config.loader.js';
import { NotFound } from '../util/response.js';
import { Validate } from '../util/validate.js';

export interface TileSetExportGet {
  Params: {
    tileSet: string;
    tileMatrix: string;
  };
}

/**
 * Export an MBTiles file
 *
 * /v1/export/:tileSet/:tileMatrixSet
 *
 * @example
 *  Vector Tileset `/v1/export/topographic/WebMercatorQuad.mbtiles`
 *
 */
export async function exportTileSetGet(req: LambdaHttpRequest<TileSetExportGet>): Promise<LambdaHttpResponse> {
  Validate.apiKey(req);

  req.set('tileSet', req.params.tileSet);

  const tileMatrix = Validate.getTileMatrixSet(req.params.tileMatrix);
  if (tileMatrix == null) throw new LambdaHttpResponse(404, 'Tile Matrix not found');

  req.set('tileMatrix', tileMatrix.identifier);
  req.set('projection', tileMatrix.projection.code);
  const config = await ConfigLoader.load(req);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(req.params.tileSet));
  req.timer.end('tileset:load');
  if (tileSet == null) return NotFound();

  // Vector tiles cannot be merged (yet!)
  if (tileSet.layers.length > 1) {
    return new LambdaHttpResponse(500, `Too many layers in vector tileset ${tileSet.layers.length}`);
  }

  const epsgCode = tileMatrix.projection.code;
  const layerId = tileSet.layers[0][epsgCode];
  if (layerId == null) return new LambdaHttpResponse(404, `No data found for tile matrix: ${tileMatrix.identifier}`);

  if (!layerId.startsWith('s3://')) return new LambdaHttpResponse(400, `Unable to export tilesets not inside of S3`);
  if (!layerId.endsWith('.tar.co')) return new LambdaHttpResponse(400, `Unable to export tileset`);

  const target = new URL(layerId.replace('.tar.co', '.mbtiles'));
  const exists = await fsa.exists(target);
  if (!exists) return NotFound();

  const presignedUrl = await signS3Get(target);

  return new LambdaHttpResponse(302, 'Moved', { location: presignedUrl });
}
