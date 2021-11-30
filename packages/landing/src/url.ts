import { TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Config } from './config.js';

export interface LonLat {
  lat: number;
  lon: number;
}

export interface MapLocation extends LonLat {
  zoom: number;
}

export const enum MapOptionType {
  TileRaster = 'raster',
  TileVectorStyle = 'style',
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
    const api = Config.ApiKey == null || Config.ApiKey === '' ? '' : `?api=${Config.ApiKey}`;
    return `${this.baseUrl()}/v1/tiles/WMTSCapabilities.xml${api}`;
  },

  toTileUrl(urlType: MapOptionType, tileMatrix: TileMatrixSet, layerId: string, style?: string | null): string {
    const api = Config.ApiKey == null || Config.ApiKey === '' ? '' : `?api=${Config.ApiKey}`;

    const isDefaultTileMatrix = TileMatrixSets.get(tileMatrix.projection).identifier === tileMatrix.identifier;
    const projectionPath = isDefaultTileMatrix ? tileMatrix.projection.toEpsgString() : tileMatrix.identifier;
    const baseTileUrl = `${this.baseUrl()}/v1/tiles/${layerId}/${projectionPath}`;

    if (urlType === MapOptionType.TileRaster) return `${baseTileUrl}/{z}/{x}/{y}.${WindowUrl.ImageFormat}${api}`;
    if (urlType === MapOptionType.TileVectorXyz) return `${baseTileUrl}/{z}/{x}/{y}.pbf${api}`;
    if (urlType === MapOptionType.TileVectorStyle) return `${baseTileUrl}/style/${style}.json${api}`;
    if (urlType === MapOptionType.Wmts) return `${baseTileUrl}/WMTSCapabilities.xml${api}`;
    if (urlType === MapOptionType.Attribution) return `${baseTileUrl}/attribution.json${api}`;
    if (urlType === MapOptionType.TileWmts) {
      return `${baseTileUrl}/{TileMatrix}/{TileCol}/{TileRow}.${WindowUrl.ImageFormat}${api}`;
    }

    throw new Error('Unknown url type: ' + urlType);
  },
};
