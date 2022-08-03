import { Config, TileSetType } from '@basemaps/config';
import { GoogleTms } from '@basemaps/geo';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { convertRelativeUrl } from '../routes/tile.style.json';
import { NotFound } from '../util/response';
import { Validate } from '../util/validate';

export interface VectorTileServer {
  Params: {
    tileSet: string;
  };
}

export async function arcgisTileServerGet(req: LambdaHttpRequest<VectorTileServer>): Promise<LambdaHttpResponse> {
  const tileSet = await Config.TileSet.get(Config.TileSet.id(req.params.tileSet));
  if (tileSet?.type !== TileSetType.Vector) return NotFound();
  const apiKey = Validate.apiKey(req);
  const f = req.query.get('f');
  if (f !== 'json') return NotFound();
  const extent = {
    xmin: GoogleTms.extent.x,
    ymin: GoogleTms.extent.y,
    xmax: GoogleTms.extent.right,
    ymax: GoogleTms.extent.bottom,
    // TODO where is wkid from
    spatialReference: { wkid: 102100, latestWkid: GoogleTms.projection.code },
  };
  const vectorTileServer = {
    currentVersion: 10.81,
    name: tileSet.name,
    capabilities: 'TilesOnly',
    type: 'indexedVector',
    defaultStyles: '',
    tiles: [convertRelativeUrl(`/v1/tiles/${tileSet.name}/WebMercatorQuad/{z}/{x}/{y}.pbf`, apiKey)],
    exportTilesAllowed: false,
    maxExportTilesCount: 0,
    initialExtent: extent,
    fullExtent: extent,
    minScale: 0.0,
    maxScale: 0.0,
    tileInfo: {
      // TODO are all the pbf 256x256?
      rows: 512,
      cols: 512,
      dpi: 96,
      format: 'pbf',
      origin: { x: GoogleTms.extent.x, y: GoogleTms.extent.bottom },
      spatialReference: { wkid: 102100, latestWkid: GoogleTms.projection.code },
      lods: GoogleTms.zooms.slice(1, 18).map((c, i) => {
        return {
          level: i,
          resolution: c.scaleDenominator * 0.28e-3,
          scale: c.scaleDenominator,
        };
      }),
    },
    maxzoom: 22,
    minLOD: 0,
    maxLOD: 15,
    resourceInfo: {
      styleVersion: 8,
      tileCompression: 'gzip',
      cacheInfo: { storageInfo: { packetSize: 128, storageFormat: 'compactV2' } },
    },
  };

  const json = JSON.stringify(vectorTileServer, null, 2);
  const data = Buffer.from(json);

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}
