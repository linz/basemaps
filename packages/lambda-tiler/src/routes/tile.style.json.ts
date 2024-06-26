import { ConfigId, ConfigPrefix, ConfigTileSetRaster, Layer, Sources, StyleJson, TileSetType } from '@basemaps/config';
import { GoogleTms, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Env, toQueryString } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { URL } from 'url';

import { ConfigLoader } from '../util/config.loader.js';
import { Etag } from '../util/etag.js';
import { NotFound, NotModified } from '../util/response.js';
import { Validate } from '../util/validate.js';

/**
 * Convert relative URLS into a full hostname url
 * @param url possible url to update
 * @param apiKey ApiKey to append with ?api= if required
 * @returns Updated Url or empty string if url is empty
 */
export function convertRelativeUrl(
  url?: string,
  tileMatrix?: TileMatrixSet,
  apiKey?: string,
  config?: string | null,
): string {
  if (url == null) return '';
  if (tileMatrix) url = url.replace('{tileMatrix}', tileMatrix.identifier);
  const host = Env.get(Env.PublicUrlBase) ?? '';
  if (!url.startsWith('/')) return url; // Not relative ignore
  const fullUrl = new URL(url, host);
  if (apiKey) fullUrl.searchParams.set('api', apiKey);
  if (config) fullUrl.searchParams.set('config', config);
  return fullUrl.toString().replace(/%7B/g, '{').replace(/%7D/g, '}');
}

/**
 * Create a new style json that has absolute urls to the current host and  API Keys where required
 * @param style style to update
 * @param apiKey api key to inject
 * @returns new stylejson
 */
export function convertStyleJson(
  style: StyleJson,
  tileMatrix: TileMatrixSet,
  apiKey: string,
  config: string | null,
  layers?: Layer[],
): StyleJson {
  const sources = JSON.parse(JSON.stringify(style.sources)) as Sources;
  for (const [key, value] of Object.entries(sources)) {
    if (value.type === 'vector') {
      if (tileMatrix !== GoogleTms) {
        throw new LambdaHttpResponse(400, `TileMatrix is not supported for the vector source ${value.url}.`);
      }
      value.url = convertRelativeUrl(value.url, tileMatrix, apiKey, config);
    } else if ((value.type === 'raster' || value.type === 'raster-dem') && Array.isArray(value.tiles)) {
      for (let i = 0; i < value.tiles.length; i++) {
        value.tiles[i] = convertRelativeUrl(value.tiles[i], tileMatrix, apiKey, config);
      }
    }
    sources[key] = value;
  }

  const styleJson: StyleJson = {
    version: 8,
    id: style.id,
    name: style.name,
    sources,
    layers: layers ? layers : style.layers,
  };

  if (style.metadata) styleJson.metadata = style.metadata;
  if (style.glyphs) styleJson.glyphs = convertRelativeUrl(style.glyphs, undefined, undefined, config);
  if (style.sprite) styleJson.sprite = convertRelativeUrl(style.sprite, undefined, undefined, config);

  return styleJson;
}

export interface StyleGet {
  Params: {
    styleName: string;
  };
}

function setStyleTerrain(style: StyleJson, terrain: string): void {
  const source = Object.keys(style.sources).find((s) => s === terrain);
  if (source == null) throw new LambdaHttpResponse(400, `Terrain: ${terrain} is not exists in the style source.`);
  style.terrain = {
    source,
    exaggeration: 1.2,
  };
}

async function ensureTerrain(
  req: LambdaHttpRequest<StyleGet>,
  tileMatrix: TileMatrixSet,
  apiKey: string,
  style: StyleJson,
): Promise<void> {
  const config = await ConfigLoader.load(req);
  const terrain = await config.TileSet.get('ts_elevation');
  if (terrain) {
    const configLocation = ConfigLoader.extract(req);
    const elevationQuery = toQueryString({ config: configLocation, api: apiKey, pipeline: 'terrain-rgb' });
    style.sources['LINZ-Terrain'] = {
      type: 'raster-dem',
      tileSize: 256,
      maxzoom: 18,
      tiles: [convertRelativeUrl(`/v1/tiles/elevation/${tileMatrix.identifier}/{z}/{x}/{y}.png${elevationQuery}`)],
    };
  }
}

export async function tileSetToStyle(
  req: LambdaHttpRequest<StyleGet>,
  tileSet: ConfigTileSetRaster,
  tileMatrix: TileMatrixSet,
  apiKey: string,
  terrain?: string,
): Promise<LambdaHttpResponse> {
  const [tileFormat] = Validate.getRequestedFormats(req) ?? ['webp'];
  if (tileFormat == null) return new LambdaHttpResponse(400, 'Invalid image format');

  const pipeline = Validate.pipeline(tileSet, tileFormat, req.query.get('pipeline'));
  const pipelineName = pipeline?.name === 'rgba' ? undefined : pipeline?.name;

  const configLocation = ConfigLoader.extract(req);
  const query = toQueryString({ config: configLocation, api: apiKey, pipeline: pipelineName });

  const tileUrl =
    (Env.get(Env.PublicUrlBase) ?? '') +
    `/v1/tiles/${tileSet.name}/${tileMatrix.identifier}/{z}/{x}/{y}.${tileFormat}${query}`;

  const styleId = `basemaps-${tileSet.name}`;
  const style: StyleJson = {
    id: ConfigId.prefix(ConfigPrefix.Style, tileSet.name),
    name: tileSet.name,
    version: 8,
    sources: { [styleId]: { type: 'raster', tiles: [tileUrl], tileSize: 256 } },
    layers: [{ id: styleId, type: 'raster', source: styleId }],
  };

  // Ensure elevation for individual tilesets
  await ensureTerrain(req, tileMatrix, apiKey, style);

  // Add terrain in style
  if (terrain) setStyleTerrain(style, terrain);

  const data = Buffer.from(JSON.stringify(style));

  const cacheKey = Etag.key(data);
  if (Etag.isNotModified(req, cacheKey)) return NotModified();

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}

export function tileSetOutputToStyle(
  req: LambdaHttpRequest<StyleGet>,
  tileSet: ConfigTileSetRaster,
  tileMatrix: TileMatrixSet,
  apiKey: string,
  terrain?: string,
): Promise<LambdaHttpResponse> {
  const configLocation = ConfigLoader.extract(req);
  const query = toQueryString({ config: configLocation, api: apiKey });

  const styleId = `basemaps-${tileSet.name}`;
  const sources: Sources = {};
  const layers: Layer[] = [];

  if (tileSet.outputs) {
    //for loop output.
    for (const output of tileSet.outputs) {
      const format = output.format?.[0] ?? 'webp';
      const urlBase = Env.get(Env.PublicUrlBase) ?? '';
      const tileUrl = `${urlBase}/v1/tiles/${tileSet.name}/${tileMatrix.identifier}/{z}/{x}/{y}.${format}${query}`;

      if (output.name === 'terrain-rgb') {
        // Add both raster source and dem raster source for terrain-rgb output
        sources[`${styleId}-${output.name}`] = {
          type: 'raster',
          tiles: [tileUrl + `&pipeline=${output.name}`],
          tileSize: 256,
        };
        sources[`${styleId}-${output.name}-dem`] = {
          type: 'raster-dem',
          tiles: [tileUrl + `&pipeline=${output.name}`],
          tileSize: 256,
        };
      } else {
        // Add raster source other outputs
        sources[`${styleId}-${output.name}`] = {
          type: 'raster',
          tiles: [tileUrl + `&pipeline=${output.name}`],
          tileSize: 256,
        };
      }
    }
  }

  // Add first raster source as default layer
  for (const source of Object.keys(sources)) {
    if (sources[source].type === 'raster') {
      layers.push({
        id: styleId,
        type: 'raster',
        source,
      });
      break;
    }
  }

  const style: StyleJson = {
    id: ConfigId.prefix(ConfigPrefix.Style, tileSet.name),
    name: tileSet.name,
    version: 8,
    sources,
    layers,
  };

  // Add terrain in style
  if (terrain) setStyleTerrain(style, terrain);

  const data = Buffer.from(JSON.stringify(style));

  const cacheKey = Etag.key(data);
  if (Etag.isNotModified(req, cacheKey)) return Promise.resolve(NotModified());

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return Promise.resolve(response);
}

export async function styleJsonGet(req: LambdaHttpRequest<StyleGet>): Promise<LambdaHttpResponse> {
  const apiKey = Validate.apiKey(req);
  const styleName = req.params.styleName;
  const excludeLayers = req.query.getAll('exclude');
  const excluded = new Set(excludeLayers.map((l) => l.toLowerCase()));
  const tileMatrix = TileMatrixSets.find(req.query.get('tileMatrix') ?? GoogleTms.identifier);
  if (tileMatrix == null) return new LambdaHttpResponse(400, 'Invalid tile matrix');
  const terrain = req.query.get('terrain') ?? undefined;

  // Get style Config from db
  const config = await ConfigLoader.load(req);
  const dbId = config.Style.id(styleName);
  const styleConfig = await config.Style.get(dbId);
  if (styleConfig == null) {
    // Were we given a tileset name instead, generated
    const tileSet = await config.TileSet.get(config.TileSet.id(styleName));
    if (tileSet == null) return NotFound();
    if (tileSet.type !== TileSetType.Raster) return NotFound();
    if (tileSet.outputs) return tileSetOutputToStyle(req, tileSet, tileMatrix, apiKey, terrain);
    else return tileSetToStyle(req, tileSet, tileMatrix, apiKey, terrain);
  }

  // Prepare sources and add linz source
  const style = convertStyleJson(
    styleConfig.style,
    tileMatrix,
    apiKey,
    ConfigLoader.extract(req),
    styleConfig.style.layers.filter((f) => !excluded.has(f.id.toLowerCase())),
  );

  // Ensure elevation for style json config
  // TODO: We should remove this after adding terrain source into style configs. PR-916
  await ensureTerrain(req, tileMatrix, apiKey, style);

  // Add terrain in style
  if (terrain) setStyleTerrain(style, terrain);

  const data = Buffer.from(JSON.stringify(style));

  const cacheKey = Etag.key(data);
  if (Etag.isNotModified(req, cacheKey)) return NotModified();

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}
