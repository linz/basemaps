import { ImageFormat, LatLon, Projection, TileMatrixSet, TileMatrixSets, VectorFormat } from '@basemaps/geo';
import { Const, isValidApiKey, truncateApiKey } from '@basemaps/shared';
import { getImageFormat } from '@basemaps/tiler';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { TileXyzGet } from '../routes/tile.xyz';

export interface TileXyz {
  tile: { x: number; y: number; z: number };
  tileSet: string;
  tileMatrix: TileMatrixSet;
  tileType: VectorFormat | ImageFormat;
}

export interface TileMatrixRequest {
  Params: { tileMatrix?: string };
}

export const Validate = {
  /**
   * Validate that the api key exists and is valid
   * @throws if api key is not valid
   */
  apiKey(req: LambdaHttpRequest): string {
    const apiKey = req.query.get(Const.ApiKey.QueryString) ?? req.header('X-LINZ-Api-Key');
    const valid = isValidApiKey(apiKey);

    if (!valid.valid) throw new LambdaHttpResponse(400, 'API Key Invalid: ' + valid.message);
    // Truncate the API Key so we are not logging the full key
    req.set('api', truncateApiKey(apiKey));
    return apiKey as string;
  },

  getTileMatrixSet(str?: string): TileMatrixSet | null {
    return TileMatrixSets.find(str);
  },

  /** Read in all image formats specified in the query parameters "format" or "tileFormat" */
  getRequestedFormats(req: LambdaHttpRequest): ImageFormat[] | null {
    const formats = [...req.query.getAll('format'), ...req.query.getAll('tileFormat')];
    if (formats.length === 0) return null;

    const output: Set<ImageFormat> = new Set();
    for (const fmt of formats) {
      const parsed = getImageFormat(fmt);
      if (parsed == null) continue;
      output.add(parsed);
    }
    if (output.size === 0) return null;
    return [...output.values()];
  },

  getTileFormat(tileType: string): ImageFormat | VectorFormat | null {
    const ext = getImageFormat(tileType);
    if (ext) return ext;
    if (tileType === VectorFormat.MapboxVectorTiles) return VectorFormat.MapboxVectorTiles;
    return null;
  },

  /** Validate that a lat and lon are between -90/90 and -180/180 */
  getLocation(lonIn: string, latIn: string): LatLon | null {
    const lat = parseFloat(latIn);
    const lon = parseFloat(lonIn);
    if (isNaN(lon) || lon < -180 || lon > 180) return null;
    if (isNaN(lat) || lat < -90 || lat > 90) return null;
    return { lon, lat };
  },
  /**
   * Validate that the tile request is somewhat valid
   * - Valid projection
   * - Valid range
   *
   * @throws LambdaHttpResponse for tile requests that are not valid
   *
   * @param req request to validate
   * @param xyzData
   */
  xyz(req: LambdaHttpRequest<TileXyzGet>): TileXyz {
    Validate.apiKey(req);

    req.set('tileSet', req.params.tileSet);

    const x = parseInt(req.params.x, 10);
    const y = parseInt(req.params.y, 10);
    const z = parseInt(req.params.z, 10);

    const tileMatrix = Validate.getTileMatrixSet(req.params.tileMatrix);
    if (tileMatrix == null) throw new LambdaHttpResponse(404, 'Tile Matrix not found');

    req.set('tileMatrix', tileMatrix.identifier);
    req.set('projection', tileMatrix.projection.code);

    const tileType = Validate.getTileFormat(req.params.tileType);
    if (tileType == null) throw new LambdaHttpResponse(404, 'Tile extension not found');
    req.set('extension', tileType);

    if (isNaN(z) || z > tileMatrix.maxZoom || z < 0) throw new LambdaHttpResponse(404, `Zoom not found: ${z}`);

    const zoom = tileMatrix.zooms[z];
    if (isNaN(x) || x < 0 || x > zoom.matrixWidth) throw new LambdaHttpResponse(404, `X not found: ${x}`);
    if (isNaN(y) || y < 0 || y > zoom.matrixHeight) throw new LambdaHttpResponse(404, `Y not found: ${y}`);

    const xyzData = { tile: { x, y, z }, tileSet: req.params.tileSet, tileMatrix, tileType };
    req.set('xyz', xyzData.tile);

    const latLon = Projection.tileCenterToLatLon(tileMatrix, xyzData.tile);
    req.set('location', latLon);

    return xyzData;
  },
};
