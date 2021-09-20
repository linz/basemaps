export interface MosaicJsonV002 {
  /**
   * The version of the MosaicJSON spec that is implemented by this JSON object.
   * A semver.org style version number.
   */
  mosiacjson: '0.0.2';

  /**
   * A text description of the tileset. The description can contain any legal character.
   *
   * Implementations SHOULD NOT interpret the description as HTML.
   * @optional
   * @default null
   */
  name: string;

  /**
   * A name describing the tileset. The name can contain any legal character.
   *
   * Implementations SHOULD NOT interpret the name as HTML.
   * @optional
   * @default null.
   */
  description: string | null;

  /**
   * When changes across files are introduced, the minor version MUST change.
   * This may lead to cut off labels. Therefore, implementors can decide to
   * clean their cache when the minor version changes. Changes to the patch
   * level MUST only have changes to tiles that are contained within one tile.
   * When tiles change significantly, the major version MUST be increased.
   * Implementations MUST NOT use tiles with different major versions.
   *
   * A semver.org style version number.
   *
   * @optional
   * @default null
   */
  version: string | null;

  /** An integer specifying the minimum zoom level. */
  minzoom: number;

  /** An integer specifying the maximum zoom level. MUST be >= minzoom. */
  maxzoom: number;

  /**
   * The maximum extent of available map tiles. Bounds MUST define an area
   * covered by all zoom levels. The bounds are represented in WGS:84
   * latitude and longitude values, in the order left, bottom, right, top.
   * Values may be integers or floating point numbers.
   */
  bounds: number[];

  /**
   * The zoom value for the quadkey index. MUST be =< maxzoom.
   * If quadkey_zoom is > minzoom, then on each tile request from zoom between
   * minzoom and quadkey_zoom, the tiler will merge each quadkey asset lists.
   * The use of quadkey_zoom can be beneficial when dealing with a high number
   * of files and a large area.
   * @optional
   */
  quadkey_zoom: number;

  /**
   * The first value is the longitude, the second is latitude (both in WGS:84 values), the third value is the zoom level as an integer.
   * Longitude and latitude MUST be within the specified bounds. The zoom level MUST be between minzoom and maxzoom.
   * Implementations can use this value to set the default location. If the value is null, implementations may use their own algorithm for
   * determining a default location.
   *
   * @optional
   * @default null
   */
  center: number[] | null;
  /**
   * A dictionary of per quadkey dataset in form of {quadkeys: [datasets]} pairs.
   * Keys MUST be valid quadkeys index with zoom level equal to mosaic `minzoom`.
   * Values MUST be arrays of strings (url or sceneid) pointing to a
   * Cloud Optimized dataset with bounds intersecting with the quadkey bounds.
   */
  tiles: {
    [quadKey: string]: string[];
  };
}
