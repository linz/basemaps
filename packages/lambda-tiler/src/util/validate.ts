import { ConfigTileSetRaster, ConfigTileSetRasterOutput } from '@basemaps/config';
import { ImageFormat, LatLon, Projection, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Const, isValidApiKey, truncateApiKey } from '@basemaps/shared';
import { getImageFormat } from '@basemaps/tiler';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { TileXyzGet } from '../routes/tile.xyz.js';

export interface TileXyz {
  /** Tile XYZ location */
  tile: { x: number; y: number; z: number };
  /** Name of the tile set to use */
  tileSet: string;
  /** TileMatrix that is requested */
  tileMatrix: TileMatrixSet;
  /** Output tile format */
  tileType: string;
  /** Optional processing pipeline to use */
  pipeline?: string | null;
}

export interface TileMatrixRequest {
  Params: { tileMatrix?: string };
}

export const Validate = {
  /**
   * Validate that the api key exists and is valid
   *
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

    if (req.params.tileType == null) throw new LambdaHttpResponse(404, 'Tile extension not found');

    req.set('extension', req.params.tileType);

    if (isNaN(z) || z > tileMatrix.maxZoom || z < 0) throw new LambdaHttpResponse(404, `Zoom not found: ${z}`);

    const zoom = tileMatrix.zooms[z];
    if (isNaN(x) || x < 0 || x > zoom.matrixWidth) throw new LambdaHttpResponse(404, `X not found: ${x}`);
    if (isNaN(y) || y < 0 || y > zoom.matrixHeight) throw new LambdaHttpResponse(404, `Y not found: ${y}`);

    const pipeline = req.query.get('pipeline');
    if (pipeline) req.set('pipeline', pipeline);

    const xyzData = {
      tile: { x, y, z },
      tileSet: req.params.tileSet,
      tileMatrix,
      tileType: req.params.tileType,
      pipeline: req.query.get('pipeline'),
    };
    req.set('xyz', xyzData.tile);

    const latLon = Projection.tileCenterToLatLon(tileMatrix, xyzData.tile);
    req.set('location', latLon);

    return xyzData;
  },

  /**
   * Lookup the raster configuration pipeline for a output tile type
   *
   * Defaults to standard image format output if no outputs are defined on the tileset
   */
  pipeline(tileSet: ConfigTileSetRaster, tileType: string, pipeline?: string | null): ConfigTileSetRasterOutput | null {
    if (pipeline != null && pipeline !== 'rgba') {
      if (tileSet.outputs == null) throw new LambdaHttpResponse(404, 'TileSet has no pipelines');
      const output = tileSet.outputs.find((f) => f.name === pipeline);
      if (output == null) throw new LambdaHttpResponse(404, `TileSet has no pipeline named "${pipeline}"`);

      // If lossless mode is needed validate that its either WebP or PNG
      if (output.output?.lossless) {
        if (tileType === 'webp' || tileType === 'png') return output;
        throw new LambdaHttpResponse(400, 'Lossless output is required for pipeline:' + pipeline);
      }
      return output;
    }
    // If the tileset has pipelines defined the user MUST specify which one
    if (tileSet.outputs) {
      throw new LambdaHttpResponse(404, 'TileSet needs pipeline: ' + tileSet.outputs.map((f) => f.name));
    }

    // Generate a default RGBA configuration
    const img = getImageFormat(tileType ?? 'webp');
    if (img == null) return null;
    return {
      title: `RGBA ${tileType}`,
      name: 'rgba',
      output: {
        type: [img],
        lossless: img === 'png' ? true : false,
        background: tileSet.background,
      },
    } as ConfigTileSetRasterOutput;
  },
};
