import { base58, isBase58 } from '@basemaps/config/build/base58.js';
import { GoogleTms, TileMatrixSet } from '@basemaps/geo';
import { toQueryString } from '@basemaps/shared/build/url.js';
import { BBox } from '@linzjs/geojson';

import { LabelsDisabledLayers } from './components/map.label.js';
import { Config } from './config.js';
import { FilterDate } from './config.map.js';

export interface LonLat {
  lat: number;
  lon: number;
}

export interface MapLocation extends LonLat {
  /**
   * Current map zoom
   *
   * @example 11.94
   */
  zoom: number;

  /**
   * Current map bearing in degrees
   *
   * Between -180 and 180
   *
   * @default 0
   * @example -43.7
   */
  bearing?: number;

  /**
   * Current map pitch in degrees
   *
   * Between 0 and {@link LocationUrl.PitchMaxDegrees}
   *
   * @default 0
   * @example 12.7
   */
  pitch?: number;

  /**
   * Optional bounding box of the map's view
   */
  extent?: BBox;
}

export const enum MapOptionType {
  TileRaster = 'raster',
  Style = 'style',
  TileVectorXyz = 'vector-xyz',
  TileVectorJson = 'vector-tile-json',
  TileWmts = 'tile-wmts',
  Wmts = 'wmts',
  Attribution = 'attribution',
}

export interface TileUrlParams {
  urlType: MapOptionType;
  tileMatrix: TileMatrixSet;
  layerId: string;
  style?: string | null;
  config?: string | null;
  pipeline?: string | null;
  date?: FilterDate;
  imageFormat?: string | null;
  terrain?: string | null;
  labels?: boolean | null;
}

export function ensureBase58(s: null): null;
export function ensureBase58(s: string): string;
export function ensureBase58(s: string | null): string | null;
export function ensureBase58(s: string | null): string | null {
  if (s == null) return null;
  if (isBase58(s)) return s;
  const text = new TextEncoder();
  const buffer = text.encode(s);
  return base58.encode(buffer);
}

export const WindowUrl = {
  ImageFormat: 'png',

  baseUrl(): string {
    const baseUrl = Config.BaseUrl;
    if (baseUrl === '') return window.location.origin;
    if (!baseUrl.startsWith('http')) throw new Error('BaseURL must start with http(s)://');
    return baseUrl;
  },

  toBaseWmts(): string {
    const query = toQueryString({ api: Config.ApiKey, config: ensureBase58(Config.map.config) });
    return `${this.baseUrl()}/v1/tiles/all/WMTSCapabilities.xml${query}`;
  },

  toImageryUrl(layerId: string, imageryType: string): string {
    const query = toQueryString({ config: ensureBase58(Config.map.config) });
    return `${this.baseUrl()}/v1/imagery/${layerId}/${imageryType}${query}`;
  },

  toTileUrl(params: TileUrlParams): string {
    const queryParams = new URLSearchParams();

    if (Config.ApiKey != null && Config.ApiKey !== '') queryParams.set('api', Config.ApiKey);
    if (params.config != null) queryParams.set('config', ensureBase58(params.config));
    if (params.pipeline != null) queryParams.set('pipeline', params.pipeline);
    if (params.date?.before != null) queryParams.set('date[before]', params.date.before);
    if (params.terrain != null && params.urlType === MapOptionType.Style) queryParams.set('terrain', params.terrain);
    if (params.labels && params.urlType === MapOptionType.Style) {
      // Some layers have the label option disabled, do not append the labels request to those layers.
      if (!LabelsDisabledLayers.has(params.style ?? '')) queryParams.set('labels', String(params.labels));
    }

    const imageFormat = params.imageFormat ?? WindowUrl.ImageFormat;
    if (params.urlType === MapOptionType.Style) {
      if (params.tileMatrix.identifier !== GoogleTms.identifier)
        queryParams.set('tileMatrix', params.tileMatrix.identifier);
      if (imageFormat !== 'webp') queryParams.set('format', imageFormat);
    }

    // If a image format is directly requested ensure it is passed through to the WMTS
    // only some layers like terrain-rgb need a forced image format
    if (params.imageFormat && params.urlType === MapOptionType.Wmts) queryParams.set('tileFormat', params.imageFormat);

    const q = '?' + queryParams.toString();

    const baseTileUrl = `${this.baseUrl()}/v1/tiles/${params.layerId}/${params.tileMatrix.identifier}`;

    if (params.urlType === MapOptionType.TileRaster) return `${baseTileUrl}/{z}/{x}/{y}.${imageFormat}${q}`;
    if (params.urlType === MapOptionType.TileVectorXyz) return `${baseTileUrl}/{z}/{x}/{y}.pbf${q}`;
    if (params.urlType === MapOptionType.TileVectorJson) return `${baseTileUrl}/tile.json${q}`;
    if (params.urlType === MapOptionType.Style)
      return `${this.baseUrl()}/v1/styles/${params.style ?? params.layerId}.json${q}`;
    if (params.urlType === MapOptionType.Wmts) return `${baseTileUrl}/WMTSCapabilities.xml${q}`;
    if (params.urlType === MapOptionType.Attribution) return `${baseTileUrl}/attribution.json${q}`;
    if (params.urlType === MapOptionType.TileWmts) {
      return `${baseTileUrl}/{TileMatrix}/{TileCol}/{TileRow}.${imageFormat}${q}`;
    }

    throw new Error('Unknown url type: ' + String(params.urlType));
  },

  toConfigUrl(layerId: string, config: string | null = Config.map.config): string {
    const query = toQueryString({ api: Config.ApiKey, config });
    return `${this.baseUrl()}/v1/config/${layerId}.json${query}`;
  },

  toConfigImageryUrl(layerId: string, imageryId: string, config: string | null = Config.map.config): string {
    const query = toQueryString({ api: Config.ApiKey, config });
    return `${this.baseUrl()}/v1/config/${layerId}/${imageryId}.json${query}`;
  },
};
