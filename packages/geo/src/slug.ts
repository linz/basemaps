import { TileMatrixSets } from './tms/index.js';

export interface LonLat {
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
}

export interface LonLatZoom extends LonLat {
  zoom: number;
  bearing?: number;
  pitch?: number;
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

  /**
   * Optional configuration of how to render the imagery
   *
   * @example
   * "terrain-rgb"
   * "color-ramp"
   */
  pipeline?: string;
}

export const LocationSlug = {
  /**
   * Number of decimal places to fix a decimal latitude/longitude
   *
   * 7 Decimal places is approx 0.011m of precision,
   *
   * Every decimal place is a factor of 10 precision
   * 5DP - 1.11m
   * 6DP - 0.11m
   * 7DP - 0.01m
   *
   */
  LonLatFixed: 7,

  /** Number of decimal places to fix a location zoom too */
  ZoomFixed: 2,

  /** Number of decimal places to fix a bearing */
  BearingFixed: 1,

  /** Number of decimal places to fix a pitch */
  PitchFixed: 0,

  /** Max number of degrees of pitch */
  PitchMaxDegrees: 80,

  /**
   * Truncate a lat lon based on the zoom level
   *
   * @param loc location to truncate
   */
  truncateLatLon(loc: LonLatZoom): { lon: string; lat: string; zoom: string } {
    return {
      lon: loc.lon.toFixed(LocationSlug.LonLatFixed),
      lat: loc.lat.toFixed(LocationSlug.LonLatFixed),
      zoom: loc.zoom.toFixed(LocationSlug.ZoomFixed).replace(/\.0+$/, ''), // convert 8.00 into 8
    };
  },

  /**
   * Truncate a bearing and pitch
   *
   * @param loc location to truncate
   */
  truncateBearingPitch(loc: LonLatZoom): Partial<LonLatZoom> {
    return {
      bearing: loc.bearing ? Number(loc.bearing.toFixed(LocationSlug.BearingFixed)) : undefined,
      pitch: loc.pitch ? Number(loc.pitch.toFixed(LocationSlug.PitchFixed)) : undefined,
    };
  },

  cameraStr(loc: Partial<LonLatZoom>): string {
    let str = '';
    if (loc.bearing && loc.bearing !== 0) str += `,b${loc.bearing}`;
    if (loc.pitch && loc.pitch !== 0) str += `,p${loc.pitch}`;
    return str;
  },

  /**
   * Encode a location into the format `@${lat},${lon},z${zoom},b${bearing},p${pitch}`
   *
   * This will truncate the lat, lon and zoom with {@link LocationSlug.truncateLatLon}
   *
   * @example
   * ```
   * @-39.3042625,174.0794181,z22
   * @-39.30426,174.07941,z13.5
   * ```
   */
  toSlug(loc: LonLatZoom): string {
    const fixed = LocationSlug.truncateLatLon(loc);
    return `@${fixed.lat},${fixed.lon},z${fixed.zoom}${this.cameraStr(this.truncateBearingPitch(loc))}`;
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
   * - 0 <= bearing <= 360
   * - -PitchMaxDegrees <= pitch <= PitchMaxDegrees
   *
   * @example
   *
   * ```
   * /@-39.3042625,174.0794181,z22,b225,p12.5
   * #@-39.30426,174.07941,z13.5
   * ```
   *
   * @returns location if parsed and validates, null otherwise
   */
  fromSlug(str: string): LonLatZoom | null {
    const output: Partial<LonLatZoom> = {};
    const [latS, lonS, zoomS, bearingPitchA, bearingPitchB] = removeLocationPrefix(str).split(',');

    const lat = parseFloat(latS);
    if (isNaN(lat) || lat < -90 || lat > 90) return null;
    output.lat = lat;

    const lon = parseFloat(lonS);
    if (isNaN(lon) || lon < -180 || lon > 180) return null;
    output.lon = lon;

    const zoom = LocationSlug.parseZoom(zoomS);
    if (zoom == null || isNaN(zoom) || zoom < 0 || zoom > 32) return null;
    output.zoom = zoom;

    for (const c of [bearingPitchA, bearingPitchB]) {
      if (c == null) continue;
      if (c.startsWith('b')) {
        const bearing = parseFloat(c.slice(1));
        if (isNaN(bearing) || bearing < 0 || bearing > 360) continue;
        else output.bearing = bearing;
      } else if (c.startsWith('p')) {
        const pitch = parseFloat(c.slice(1));
        if (isNaN(pitch) || pitch < -LocationSlug.PitchMaxDegrees || pitch > LocationSlug.PitchMaxDegrees) continue;
        else output.pitch = pitch;
      }
    }

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
      pipeline: str.get('pipeline') ?? undefined,
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
