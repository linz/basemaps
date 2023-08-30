import { TileMatrixSets } from './tms/index.js';

export interface LonLat {
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
}

export interface LonLatZoom extends LonLat {
  zoom: number;
}

export interface LocationQueryConfig {
  /**
   * Style name which is generally a `tileSetId`
   *
   * @example
   * "aerial"
   * "aerialhybrid"
   * "bounty-islands-satellite-2020-0.5m"
   */
  style: string;
  /**
   * TileMatrixSet identifier
   *
   * @example
   * "WebMercatorQuad"
   * "NZTM2000Quad"
   */
  tileMatrix: string;
}

const TrailingZeros = /\.0+$/;

export const LocationUrl = {
  /**
   * Truncate a lat lon based on the zoom level
   *
   * When zoomed out use a lower precision 5 decimal places (~1m)
   * and as zoom increased increase the precision to 6DP then 7DP
   *
   * Truncates zoom to at most 2 decimal places
   *
   * @param loc location to truncate
   */
  truncateLatLon(loc: LonLatZoom): { lon: string; lat: string; zoom: string } {
    let fixedLevel: number;
    if (loc.zoom < 18) fixedLevel = 5;
    else if (loc.zoom < 20) fixedLevel = 6;
    else fixedLevel = 7;

    return {
      lon: String(Number(loc.lon.toFixed(fixedLevel))),
      lat: String(Number(loc.lat.toFixed(fixedLevel))),
      zoom: String(Number(loc.zoom.toFixed(2))),
    };
  },

  /**
   * Encode a location into the format `@${lat},${lon},z${zoom}`
   *
   * This will truncate the lat, lon and zoom with {@link LocationUrl.truncateLatLon}
   *
   * @example`
   * ```
   * @-39.3042625,174.0794181,z22
   * @-39.30426,174.07941,z13.5
   * ```
   */
  toLocation(loc: LonLatZoom): string {
    const fixed = LocationUrl.truncateLatLon(loc);
    return `@${fixed.lat},${fixed.lon},z${fixed.zoom}`;
  },

  /**
   * Parsing zooms form a string in a format of `z14` or `14z`
   *
   * @param zoom string to parse zoom from
   */
  parseZoom(zoom: string | null): number | null {
    if (zoom == null || zoom === '') return null;
    if (zoom.startsWith('z')) return parseFloat(zoom.slice(1));
    if (zoom.endsWith('z')) return parseFloat(zoom);
    return null;
  },

  /**
   * Parse a location into a lat lon zoom pair
   * Validates that the location is withing the bounds
   *
   * - -90 <= lat <= 90
   * - -190 <= lon <= 180
   * - 0 <= zoom <= 32
   *
   * @example
   *
   * ```
   * /@-39.3042625,174.0794181,z22
   * #@-39.30426,174.07941,z13.5
   * ```
   *
   * @returns location if parsed and validates, null otherwise
   */
  fromLocation(str: string): LonLatZoom | null {
    const output: Partial<LonLatZoom> = {};
    const [latS, lonS, zoomS] = removeLocationPrefix(str).split(',');

    const lat = parseFloat(latS);
    if (isNaN(lat) || lat < -180 || lat > 180) return null;
    output.lat = lat;

    const lon = parseFloat(lonS);
    if (isNaN(lon) || lon < -90 || lon > 90) return null;
    output.lon = lon;

    const zoom = LocationUrl.parseZoom(zoomS);
    if (zoom == null || isNaN(zoom) || zoom < 0 || zoom > 32) return null;
    output.zoom = zoom;

    return output as LonLatZoom;
  },

  /*
   * Parse common query string parameters and defaulting
   * `style` reads `?style=:style` then `?s=style` the `?i=:imageryId` defaults `aerial`
   * `tileMatrix` reads `?tileMatrix=:tileMatrixId` then `?p=:epsg|tileMatrix` then defaults to `WebMercatorQuad`
   */
  parseQuery(str: { get: (x: string) => string | null }): LocationQueryConfig {
    const tms = TileMatrixSets.find(str.get('tileMatrix') ?? str.get('p'), false);
    return {
      /** Style ordering, falling back onto the deprecated `?i=:imageryId  if it exists otherwise a default of `aerial` */
      style: str.get('style') ?? str.get('s') ?? str.get('i') ?? 'aerial',
      tileMatrix: tms?.identifier ?? 'WebMercatorQuad',
    };
  },
};

/**
 * locations have a number of starting options, trim them out to make parsing easier
 * - full pathname `/@`
 * - hash path `#@`
 * - partial string `@`
 */
function removeLocationPrefix(str: string): string {
  if (str.startsWith('/@')) return str.slice(2);
  if (str.startsWith('#@')) return str.slice(2);
  if (str.startsWith('@')) return str.slice(1);
  return str;
}
