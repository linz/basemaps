import { GoogleTms, ImageFormat, TileMatrixSet } from '@basemaps/geo';
import { Config } from './config.js';
import { toQueryString } from '@basemaps/shared/build/url.js';

export interface LonLat {
  lat: number;
  lon: number;
}

export interface MapLocation extends LonLat {
  zoom: number;
}

export const enum MapOptionType {
  TileRaster = 'raster',
  Style = 'style',
  TileVectorXyz = 'vector-xyz',
  TileWmts = 'tile-wmts',
  Wmts = 'wmts',
  Attribution = 'attribution',
}

export const WindowUrl = {
  ImageFormat: 'png',

  /**
   * Encode a location into the window.hash
   * Google uses ${lat},${lon},z${zoom}
   * TODO do we want to follow this
   */
  toHash(loc: MapLocation): string {
    return `#@${loc.lat.toFixed(7)},${loc.lon.toFixed(7)},z${loc.zoom}`;
  },

  /**
   * Support parsing of zooms with `z14` or `14z`
   * @param zoom string to parse zoom from
   */
  parseZoom(zoom: string | null): number {
    if (zoom == null || zoom === '') return NaN;
    if (zoom.startsWith('z')) return parseFloat(zoom.slice(1));
    if (zoom.endsWith('z')) return parseFloat(zoom);
    return NaN;
  },

  /** Parse a location from window.hash if it exists */
  fromHash(str: string): Partial<MapLocation> {
    const output: Partial<MapLocation> = {};
    const hash = str.replace('#@', '');
    const [latS, lonS, zoomS] = hash.split(',');
    const lat = parseFloat(latS);
    const lon = parseFloat(lonS);
    if (!isNaN(lat) && !isNaN(lon)) {
      output.lat = lat;
      output.lon = lon;
    }

    const newZoom = WindowUrl.parseZoom(zoomS);
    if (!isNaN(newZoom)) {
      output.zoom = newZoom;
    }

    return output;
  },

  baseUrl(): string {
    const baseUrl = Config.BaseUrl;
    if (baseUrl === '') return window.location.origin;
    if (!baseUrl.startsWith('http')) throw new Error('BaseURL must start with http(s)://');
    return baseUrl;
  },

  toBaseWmts(): string {
    const query = toQueryString({ api: Config.ApiKey, config: Config.map.config });
    return `${this.baseUrl()}/v1/tiles/aerial/WMTSCapabilities.xml${query}`;
  },

  toImageryUrl(layerId: string, imageryType: string): string {
    return `${this.baseUrl()}/v1/imagery/${layerId}/${imageryType}`;
  },

  toConfigUrl(layerId: string, config: string | null = Config.map.config): string {
    const query = toQueryString({ api: Config.ApiKey, config });
    return `${this.baseUrl()}/v1/config/${layerId}.json${query}`;
  },

  toConfigImageryUrl(layerId: string, imageryId: string, config: string | null = Config.map.config): string {
    const query = toQueryString({ api: Config.ApiKey, config });
    return `${this.baseUrl()}/v1/config/${layerId}/${imageryId}.json${query}`;
  },

  toTileUrl(
    urlType: MapOptionType,
    tileMatrix: TileMatrixSet,
    layerId: string,
    style?: string | null,
    config?: string | null,
  ): string {
    const queryParams = new URLSearchParams();
    if (Config.ApiKey != null && Config.ApiKey !== '') queryParams.set('api', Config.ApiKey);
    if (config != null) queryParams.set('config', config);

    if (urlType === MapOptionType.Style) {
      if (tileMatrix.identifier !== GoogleTms.identifier) queryParams.set('tileMatrix', tileMatrix.identifier);
      if (WindowUrl.ImageFormat !== ImageFormat.Webp) queryParams.set('format', WindowUrl.ImageFormat);
    }

    const q = '?' + queryParams.toString();

    const baseTileUrl = `${this.baseUrl()}/v1/tiles/${layerId}/${tileMatrix.identifier}`;

    if (urlType === MapOptionType.TileRaster) return `${baseTileUrl}/{z}/{x}/{y}.${WindowUrl.ImageFormat}${q}`;
    if (urlType === MapOptionType.TileVectorXyz) return `${baseTileUrl}/{z}/{x}/{y}.pbf${q}`;
    if (urlType === MapOptionType.Style) return `${this.baseUrl()}/v1/styles/${style ?? layerId}.json${q}`;
    if (urlType === MapOptionType.Wmts) return `${baseTileUrl}/WMTSCapabilities.xml${q}`;
    if (urlType === MapOptionType.Attribution) return `${baseTileUrl}/attribution.json${q}`;
    if (urlType === MapOptionType.TileWmts) {
      return `${baseTileUrl}/{TileMatrix}/{TileCol}/{TileRow}.${WindowUrl.ImageFormat}${q}`;
    }

    throw new Error('Unknown url type: ' + urlType);
  },
};
