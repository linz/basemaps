import { ConfigTileSetRaster, ConfigTileSetRasterOutput } from '@basemaps/config';
import { ImageFormat, LatLon, Projection, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Const, Env, isValidApiKey, LogConfig, truncateApiKey } from '@basemaps/shared';
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
  pipeline?: string;
}

export interface TileMatrixRequest {
  Params: { tileMatrix?: string };
}

function getBlockedApiKeys(): string[] {
  try {
    return JSON.parse(Env.get(Env.BlockedApiKeys) ?? '[]') as string[];
  } catch (e) {
    LogConfig.get().error(`"$${Env.BlockedApiKeys}" is invalid`);
    return [];
  }
}

export const Validate = {
  /** list of API Keys that have been disabled */
  blockedApiKeys: new Set<string>(getBlockedApiKeys()),

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

    if (this.blockedApiKeys.has(apiKey as string)) {
      throw new LambdaHttpResponse(429, 'Too many requests! Please contact basemaps@linz.govt.nz for a developer key');
    }

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

    const pipeline = req.query.get('pipeline') ?? undefined;
    req.set('pipeline', pipeline);

    const xyzData = {
      tile: { x, y, z },
      tileSet: req.params.tileSet,
      tileMatrix,
      tileType: req.params.tileType,
      pipeline,
    };
    req.set('xyz', xyzData.tile);

    const latLon = Projection.tileCenterToLatLon(tileMatrix, xyzData.tile);
    req.set('location', latLon);

    return xyzData;
  },

  /**
   * Get the pipeline to use for a imagery set
   *
   * @param tileSet
   * @param pipeline pipeline parameter if it exists
   * @returns 'rgba' for any pipeline without outputs, otherwise the provided pipeline or default output
   */
  pipelineName(tileSet: ConfigTileSetRaster, pipeline?: string | null): ConfigTileSetRasterOutput {
    if (pipeline == null && tileSet.outputs) {
      // If no pipeline is specified find the default pipeline
      const defaultOutput = tileSet.outputs.find((f) => f.default === true);
      if (defaultOutput) return defaultOutput;

      // If there is only one pipeline force the use of it
      if (tileSet.outputs.length === 1) return tileSet.outputs[0];

      // No default pipeline, and multiple pipelines exist one must be chosen
      throw new LambdaHttpResponse(404, 'TileSet needs pipeline: ' + tileSet.outputs.map((f) => f.name).join(', '));
      
    }

    // No pipeline and no outputs default is RGBA
    if (pipeline == null || pipeline === 'rgba') {
      return {
        title: `RGBA`,
        name: 'rgba',
        background: tileSet.background,
      };
    }

    // Pipeline defined and pipeline not found
    if (tileSet.outputs == null) throw new LambdaHttpResponse(404, `TileSet has no pipeline named "${pipeline}"`);

    const output = tileSet.outputs.find((f) => f.name === pipeline);
    if (output == null) throw new LambdaHttpResponse(404, `TileSet has no pipeline named "${pipeline}"`);
    return output;
  },

  /**
   * Lookup the raster configuration pipeline for a output tile type
   *
   * Defaults to standard image format output if no outputs are defined on the tileset
   */
  pipeline(
    tileSet: ConfigTileSetRaster,
    imageFormat?: string | null,
    pipelineName?: string | null,
  ): { output: ConfigTileSetRasterOutput; format: ImageFormat } {
    const output = Validate.pipelineName(tileSet, pipelineName);

    // Failed to parse the chosen image format
    const chosenFormat = getImageFormat(imageFormat);
    if (imageFormat != null && chosenFormat == null) {
      throw new LambdaHttpResponse(400, `TileSet pipeline "${output.name}" cannot be output as ${imageFormat}`);
    }

    // No requirement on image formats
    if (output.format == null) return { output, format: chosenFormat ?? 'webp' };
    if (chosenFormat == null) return { output, format: output.format[0] };

    // Validate selected format works as expected
    if (!output.format.includes(chosenFormat)) {
      throw new LambdaHttpResponse(400, `TileSet pipeline "${output.name}" cannot be output as ${imageFormat}`);
    }
    return { output, format: chosenFormat };
  },
};
