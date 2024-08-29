import {
  BasemapsConfigProvider,
  ConfigId,
  ConfigPrefix,
  ConfigTileSetRaster,
  Layer,
  Sources,
  StyleJson,
  TileSetType,
} from '@basemaps/config';
import { DefaultExaggeration } from '@basemaps/config/build/config/vector.style.js';
import { GoogleTms, Nztm2000QuadTms, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Env, toQueryString } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { URL } from 'url';

import { ConfigLoader } from '../util/config.loader.js';
import { Etag } from '../util/etag.js';
import { convertStyleToNztmStyle } from '../util/nztm.style.js';
import { NotFound, NotModified } from '../util/response.js';
import { Validate } from '../util/validate.js';

/**
 * Convert relative URL into a full hostname URL, converting {tileMatrix} into the provided tileMatrix
 *
 * Will also add query parameters of apiKey and configuration if provided
 *
 * @example
 * ```typescript
 * convertRelativeUrl("/v1/tiles/aerial/{tileMatrix}/{z}/{x}/{y}.webp", NZTM2000Quad)
 * "https://basemaps.linz.govt.nz/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.webp?api=c..."
 * ```
 *
 * @param url possible url to update
 * @param apiKey ApiKey to append with ?api= if required
 * @param tileMatrix replace {tileMatrix} with the tile matrix
 *
 * @returns Updated URL or empty string if url is empty
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
 * Update the style JSON to have absolute urls to the current host and API Keys where required
 *
 * @param style style to update
 * @param tileMatrix convert the tile matrix to the target tile matrix
 * @param apiKey api key to inject
 * @param config optional configuration url to use
 * @param layers replace the layers in the style json
 * @returns new style JSON
 */
export function setStyleUrls(style: StyleJson, tileMatrix: TileMatrixSet, apiKey: string, config: string | null): void {
  for (const [key, value] of Object.entries(style.sources ?? {})) {
    if (value.type === 'vector') {
      value.url = convertRelativeUrl(value.url, tileMatrix, apiKey, config);
    } else if ((value.type === 'raster' || value.type === 'raster-dem') && Array.isArray(value.tiles)) {
      for (let i = 0; i < value.tiles.length; i++) {
        value.tiles[i] = convertRelativeUrl(value.tiles[i], tileMatrix, apiKey, config);
      }
    }
    style.sources[key] = value;
  }

  if (style.glyphs) style.glyphs = convertRelativeUrl(style.glyphs, undefined, undefined, config);
  if (style.sprite) style.sprite = convertRelativeUrl(style.sprite, undefined, undefined, config);
}

export interface StyleConfig {
  /** Name of the terrain layer */
  terrain?: string | null;
  /** Combine layer with the labels layer */
  labels: boolean;
}

/**
 * Turn on the terrain setting in the style json
 */
function setStyleTerrain(style: StyleJson, terrain: string, tileMatrix: TileMatrixSet): void {
  const source = Object.keys(style.sources).find((s) => s === terrain);
  if (source == null) throw new LambdaHttpResponse(400, `Terrain: ${terrain} does not exists in the style source.`);
  style.terrain = {
    source,
    exaggeration: DefaultExaggeration[tileMatrix.identifier] ?? DefaultExaggeration[GoogleTms.identifier],
  };
}

/**
 * Merge the "labels" layer into the style json
 */
async function setStyleLabels(req: LambdaHttpRequest<StyleGet>, style: StyleJson): Promise<void> {
  const config = await ConfigLoader.load(req);
  const labels = await config.Style.get('labels');

  if (labels == null) {
    req.log.warn('LabelsStyle:Missing');
    return;
  }

  const layerId = new Set<string>();
  for (const l of style.layers) layerId.add(l.id);

  for (const newLayers of labels.style.layers) {
    if (layerId.has(newLayers.id)) {
      throw new LambdaHttpResponse(400, 'Cannot merge styles with duplicate layerIds: ' + newLayers.id);
    }
  }

  if (style.glyphs == null) style.glyphs = labels.style.glyphs;
  if (style.sprite == null) style.sprite = labels.style.sprite;
  if (style.sky == null) style.sky = labels.style.sky;

  Object.assign(style.sources, labels.style.sources);
  style.layers = style.layers.concat(labels.style.layers);
}

/**
 * Ensure that a "LINZ-Terrain" layer is force added into the output styleJSON source
 */
async function ensureTerrain(
  req: LambdaHttpRequest<StyleGet>,
  tileMatrix: TileMatrixSet,
  apiKey: string,
  style: StyleJson,
): Promise<void> {
  const config = await ConfigLoader.load(req);
  const terrain = await config.TileSet.get('elevation');
  if (terrain == null) return;
  const configLocation = ConfigLoader.extract(req);
  const elevationQuery = toQueryString({ config: configLocation, api: apiKey, pipeline: 'terrain-rgb' });
  style.sources['LINZ-Terrain'] = {
    type: 'raster-dem',
    tileSize: 256,
    maxzoom: 18, // TODO: this should be configurable based on the elevation layer
    tiles: [convertRelativeUrl(`/v1/tiles/elevation/${tileMatrix.identifier}/{z}/{x}/{y}.png${elevationQuery}`)],
  };
}

/**
 * Generate a StyleJSON from a tileset
 * @returns
 */
export function tileSetToStyle(
  req: LambdaHttpRequest<StyleGet>,
  tileSet: ConfigTileSetRaster,
  tileMatrix: TileMatrixSet,
  apiKey: string,
): StyleJson {
  // If the style has outputs defined it has a different process for generating the stylejson
  if (tileSet.outputs) return tileSetOutputToStyle(req, tileSet, tileMatrix, apiKey);

  const [tileFormat] = Validate.getRequestedFormats(req) ?? ['webp'];
  if (tileFormat == null) throw new LambdaHttpResponse(400, 'Invalid image format');

  const pipeline = Validate.pipeline(tileSet, tileFormat, req.query.get('pipeline'));
  const pipelineName = pipeline?.name === 'rgba' ? undefined : pipeline?.name;

  const configLocation = ConfigLoader.extract(req);
  const query = toQueryString({ config: configLocation, api: apiKey, pipeline: pipelineName });

  const tileUrl =
    (Env.get(Env.PublicUrlBase) ?? '') +
    `/v1/tiles/${tileSet.name}/${tileMatrix.identifier}/{z}/{x}/{y}.${tileFormat}${query}`;

  const styleId = `basemaps-${tileSet.name}`;
  return {
    id: ConfigId.prefix(ConfigPrefix.Style, tileSet.name),
    name: tileSet.name,
    version: 8,
    sources: { [styleId]: { type: 'raster', tiles: [tileUrl], tileSize: 256 } },
    layers: [{ id: styleId, type: 'raster', source: styleId }],
  };
}

/**
 * generate a style from a tile set which has a output
 */
export function tileSetOutputToStyle(
  req: LambdaHttpRequest<StyleGet>,
  tileSet: ConfigTileSetRaster,
  tileMatrix: TileMatrixSet,
  apiKey: string,
): StyleJson {
  if (tileSet.outputs == null) throw new LambdaHttpResponse(400, 'TileSet does not have any outputs to generate');
  const configLocation = ConfigLoader.extract(req);

  const styleId = `basemaps-${tileSet.name}`;
  const sources: Sources = {};
  const layers: Layer[] = [];

  for (const output of tileSet.outputs) {
    const format = output.format?.[0] ?? 'webp';
    const urlBase = Env.get(Env.PublicUrlBase) ?? '';
    const query = toQueryString({ config: configLocation, api: apiKey, pipeline: output.name });

    const tileUrl = `${urlBase}/v1/tiles/${tileSet.name}/${tileMatrix.identifier}/{z}/{x}/{y}.${format}${query}`;

    if (output.name === 'terrain-rgb') {
      // Add both raster source and dem raster source for terrain-rgb output
      sources[`${styleId}-${output.name}`] = { type: 'raster', tiles: [tileUrl], tileSize: 256 };
      sources[`${styleId}-${output.name}-dem`] = { type: 'raster-dem', tiles: [tileUrl], tileSize: 256 };
    } else {
      // Add raster source other outputs
      sources[`${styleId}-${output.name}`] = { type: 'raster', tiles: [tileUrl], tileSize: 256 };
    }
  }

  // Add first raster source as default layer
  for (const source of Object.keys(sources)) {
    if (sources[source].type === 'raster') {
      layers.push({ id: styleId, type: 'raster', source });
      break;
    }
  }

  return {
    id: ConfigId.prefix(ConfigPrefix.Style, tileSet.name),
    name: tileSet.name,
    version: 8,
    sources,
    layers,
  };
}

async function generateStyleFromTileSet(
  req: LambdaHttpRequest<StyleGet>,
  config: BasemapsConfigProvider,
  tileSetName: string,
  tileMatrix: TileMatrixSet,
  apiKey: string,
): Promise<StyleJson> {
  const tileSet = await config.TileSet.get(tileSetName);
  if (tileSet == null) throw NotFound();
  if (tileSet.type !== TileSetType.Raster) {
    throw new LambdaHttpResponse(400, 'Only raster tile sets can generate style JSON');
  }
  if (tileSet.outputs) return tileSetOutputToStyle(req, tileSet, tileMatrix, apiKey);
  else return tileSetToStyle(req, tileSet, tileMatrix, apiKey);
}

export interface StyleGet {
  Params: {
    styleName: string;
  };
}

export async function styleJsonGet(req: LambdaHttpRequest<StyleGet>): Promise<LambdaHttpResponse> {
  const apiKey = Validate.apiKey(req);
  const styleName = req.params.styleName;

  const tileMatrix = TileMatrixSets.find(req.query.get('tileMatrix') ?? GoogleTms.identifier);
  if (tileMatrix == null) return new LambdaHttpResponse(400, 'Invalid tile matrix');

  // Remove layers from the output style json
  const excludeLayers = req.query.getAll('exclude');
  const excluded = new Set(excludeLayers.map((l) => l.toLowerCase()));
  if (excluded.size > 0) req.set('excludedLayers', [...excluded]);

  /**
   * Configuration options used for the landing page:
   * "terrain" - force add a terrain layer
   * "labels" - merge the labels style with the current style
   *
   * TODO: (2024-08) this is not a very scalable way of configuring styles, it would be good to provide a styleJSON merge
   */
  const terrain = req.query.get('terrain') ?? undefined;
  const labels = Boolean(req.query.get('labels') ?? false);
  req.set('styleConfig', { terrain, labels });

  // Get style Config from db
  const config = await ConfigLoader.load(req);
  const styleConfig = await config.Style.get(styleName);
  const styleSource =
    styleConfig?.style ?? (await generateStyleFromTileSet(req, config, styleName, tileMatrix, apiKey));

  const targetStyle = structuredClone(styleSource);
  // Ensure elevation for style json config
  // TODO: We should remove this after adding terrain source into style configs. PR-916
  await ensureTerrain(req, tileMatrix, apiKey, targetStyle);

  // Add terrain in style
  if (terrain) setStyleTerrain(targetStyle, terrain, tileMatrix);
  if (labels) await setStyleLabels(req, targetStyle);

  // convert sources to full URLS and convert style between projections
  setStyleUrls(targetStyle, tileMatrix, apiKey, ConfigLoader.extract(req));

  if (tileMatrix.identifier === Nztm2000QuadTms.identifier) convertStyleToNztmStyle(targetStyle, false);

  // filter out any excluded layers
  if (excluded.size > 0) targetStyle.layers = targetStyle.layers.filter((f) => !excluded.has(f.id.toLowerCase()));

  const data = Buffer.from(JSON.stringify(targetStyle));

  const cacheKey = Etag.key(data);
  if (Etag.isNotModified(req, cacheKey)) return NotModified();

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}
