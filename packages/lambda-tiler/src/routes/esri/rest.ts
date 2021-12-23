import { GoogleTms, TileMatrixSet } from '@basemaps/geo';
import { tileXyzFromPath } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { Router } from '../../router.js';
import { TileSets } from '../../tile.set.cache.js';
import { NotFound } from '../tile.js';

export async function vectorTileServer(
  req: LambdaHttpRequest,
  layerId: string,
  tms: TileMatrixSet,
): Promise<LambdaHttpResponse> {
  if (tms.identifier !== GoogleTms.identifier) return NotFound;
  const extent = {
    xmin: tms.extent.x,
    ymin: tms.extent.y,
    xmax: tms.extent.right,
    ymax: tms.extent.bottom,
    // TODO where is wkid from
    spatialReference: { wkid: 102100, latestWkid: tms.projection.code },
  };

  const res = new LambdaHttpResponse(200, 'ok');
  res.json({
    currentVersion: 10.4,
    name: layerId,
    capabilities: 'TilesOnly',
    type: 'indexedVector',
    tileMap: 'tilemap',
    defaultStyles: 'resources/styles',
    tiles: ['tiles/{z}/{x}/{y}.pbf'],
    exportTilesAllowed: false,
    maxExportTilesCount: 0,
    initialExtent: extent,
    fullExtent: extent,
    minScale: tms.zooms[0].scaleDenominator,
    maxScale: tms.zooms[tms.zooms.length - 1].scaleDenominator,
    tileInfo: {
      // TODO are all the pbf 256x256?
      rows: 256,
      cols: 256,
      dpi: 96,
      format: 'pbf',
      origin: { x: tms.extent.x, y: tms.extent.bottom },
      spatialReference: { wkid: 102100, latestWkid: tms.projection.code },
      lods: tms.zooms.map((c, i) => {
        return {
          level: i,
          scale: c.scaleDenominator,
          resolution: c.scaleDenominator * 0.28e-3,
        };
      }),
    },
    resourceInfo: {
      styleVersion: 8,
      tileCompression: 'gzip',
      cacheInfo: { storageInfo: { packetSize: 128, storageFormat: 'compactV2' } },
    },
  });
  return res;
}

/**
 * /v1/esri/services/:layerId/VectorTileServer
 *
 * @example http://localhost:5000/v1/esri/services/topographic/VectorTileServer
 */
export async function Esri(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const { rest } = Router.action(req);
  if (rest[0] !== 'services') return NotFound;
  const layerId = rest[1];
  if (layerId == null) return NotFound;

  const serviceId = rest[2];
  if (serviceId !== 'VectorTileServer') return NotFound;
  if (rest.length === 3) return vectorTileServer(req, layerId, GoogleTms);

  if (rest[rest.length - 1].endsWith('.pbf')) {
    const generatedPath = [layerId, GoogleTms.identifier, ...rest.slice(rest.length - 3)];
    const xyz = tileXyzFromPath(generatedPath);
    if (xyz == null) return NotFound;
    req.timer.start('tileset:load');
    const tileSet = await TileSets.get(xyz.name, xyz.tileMatrix);
    req.timer.end('tileset:load');
    if (tileSet == null) return NotFound;
    return await tileSet.tile(req, xyz);
  }

  return new LambdaHttpResponse(200, 'ok');
}
