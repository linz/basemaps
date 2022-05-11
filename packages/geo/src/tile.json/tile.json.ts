export type TileJson = TileJsonV3;

export interface TileJsonV3 {
  /** Specification: https://github.com/mapbox/tilejson-spec/tree/master/3.0.0 */
  tilejson: '3.0.0';

  /**
   * A semver.org style version number of the tiles.
   * @default '1.0.0'
   */
  version?: string;

  /**
   * An array of tile endpoints. {z}, {x} and {y}, if present, are replaced with the corresponding integers.
   *
   *  If multiple endpoints are specified, clients may use any combination of endpoints.
   *
   * All endpoint urls MUST be absolute.
   * All endpoints MUST return the same content for the same URL.
   * The array MUST contain at least one endpoint.
   */
  tiles: string[];

  /** A name describing the set of tiles. */
  name?: string;
  /** A text description of the set of tiles */
  description?: string;

  /**
   * Either "xyz" or "tms". Influences the y direction of the tile coordinates.
   * @default 'xyz'
   */
  scheme?: 'xyz' | 'tms';
  /**
   * An integer specifying the minimum zoom level.
   *
   * MUST be in range: 0 <= minzoom <= maxzoom <= 30.
   *
   * @default 0
   */
  minzoom?: number;
  /**
   * An integer specifying the maximum zoom level.
   *
   * MUST be in range: 0 <= minzoom <= maxzoom <= 30
   *
   * @default 30
   */
  maxzoom?: number;

  /**
   * The maximum extent of available map tiles. Bounds MUST define an area covered by all zoom levels.
   *
   * The bounds are represented in WGS 84 latitude and longitude values, in the order left, bottom, right, top
   */
  bounds?: number[] | [number, number, number, number];
  /**
   * The first value is the longitude, the second is latitude (both in WGS:84 values), the third value is the zoom level as an integer.
   * Longitude and latitude MUST be within the specified bounds
   */
  center?: number[] | [number, number] | [number, number, number];

  /** An array of objects. Each object describes one layer of vector tile data. */
  vector_layers?: TileJsonVectorLayer[];
}

export interface TileJsonVectorLayer {
  /** A string value representing the the layer id. For added context, this is referred to as the name of the layer in the Mapbox Vector Tile spec.   */
  id: string;
  /** A string representing a human-readable description of the entire layer's contents. */
  description?: string;
  /**
   * An integer representing the lowest level whose tiles this layer appears in
   *
   * minzoom MUST be greater than or equal to the set of tiles' minzoom.
   */
  minzoom?: number;

  /**
   * An integer representing the highest level whose tiles this layer appears in.
   *
   * maxzoom MUST be less than or equal to the set of tiles' maxzoom.
   */
  maxzoom?: number;

  /**
   * An object whose keys and values are the names and descriptions of attributes available in this layer.
   *
   * Each value (description) MUST be a string that describes the underlying data.
   *
   * If no fields are present, the fields key MUST be an empty object.
   */
  fields: Record<string, string>;
}
