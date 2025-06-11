/**
 * Vector layer zoom level and detail setting
 */
export interface Styling {
  minZoom: number;
  maxZoom: number;
  detail?: number;
}

/**
 * Schema tags for vector layer
 * @example Shortbread
 * {
 *   "kind": "wood"
 * }
 */
export type Tags = Record<string, string | boolean>;

/**
 * Attributes to keep in the layer, mapping the existing source attribute name to the new name in the output schema
 * @example
 * {
 *   "topo50_id": "id"
 * }
 */
export type Attributes = Record<string, string>;

/**
 * Special tagging condition for vector layer
 * @example
 * {
 *   "condition": "hway_num != null",
 *   "tags": {
 *     "kind": "motorway"
 *   }
 * }
 */
export type SpecialTag = { condition: string; tags: Tags };

/**
 * Generalization setting for multiple zoom levels tolerance, to set this will simplify the geometry greatly reducing the size of the vector tile
 * @example
 * {
 *   "style": {
 *     "minZoom": 0,
 *     "maxZoom": 1,
 *   },
 *   "tolerance": 0.5
 * }
 */
export type Simplify = { style: Styling; tolerance?: number };

/**
 * Cache mbtile file
 */
export interface CacheFile {
  fileName: string;
  path: URL;
  exists: boolean;
}

/**
 * Record the input and output features of the
 */
export interface Metrics {
  input: number;
  output: number;
}

/**
 * Layer interface for source data layer config metadata
 */
export interface Layer {
  /** LDS layer id */
  id: string;

  /** LDS layer version */
  version?: number;

  /** layer name */
  name: string;

  /** Location of the layers paths, could be locate or s3.*/
  source: string;

  /** new tags added to layer, with key value pair, like Class:Wood */
  tags: Tags;

  /** existing attributes to keep, with key(existing attribute), value(renamed attribute), if key !== value, map the attribute name to value */
  attributes?: Attributes;

  /** layer zoom level and details */
  style: Styling;

  /** Generalization setting for multiple zoom levels tolerance */
  simplify?: Simplify[];

  /** Tippecanoe transform options */
  tippecanoe?: string[];

  /** Metrics data during the process, will capture into the stac once processed */
  metrics?: Metrics;

  /** cached mbtile filename */
  fileName?: URL;

  /** cached mbtile location */
  cache?: CacheFile;

  /** true for layer over 2GB, which will require separated node to process */
  largeLayer?: boolean;
}

/**
 * Schema metadata for vector layer
 */
export interface SchemaMetadata {
  /** All the attributes that is available for this layer, could be mapped from different attribute from source layer */
  attributes: string[];
}

/**
 * Schema interface for single vector layer that merged from multiple source layers like poi, street, building
 *
 */
export interface Schema {
  /** Schema name */
  name: string;

  /** Schema description */
  description?: string;

  /** True, if the Schema describes a non-default Shortbread layer */
  custom?: boolean;

  /** Schema metadata */
  metadata: SchemaMetadata;

  /** Generalization setting for multiple zoom levels tolerance, this will apply to all individual layers as default if no simplify defined. */
  simplify?: Simplify[];

  /** All individual layers that combined for the Schema */
  layers: Layer[];
}

/**
 * Interface describing a Report object as created and exported by the vector-cli 'reports' command.
 */
export interface Report {
  /**
   * Name of the Shortbread layer for which the report derives.
   *
   * @example "addresses"
   * @example "boundaries"
   * @example "contours"
   */
  name: string;

  /**
   * Entry object containing information from all features, regardless of `kind` attribute value.
   */
  all: ReportEntry;

  /**
   * Entry objects deriving information from all features with the same `kind` attribute value.
   *
   * @example { "contours": ReportEntry, "peaks": ReportEntry }
   */
  kinds?: Record<string, ReportEntry>;
}

export interface ReportEntry {
  /**
   * @example { "feature": { "guaranteed": true, "type": "string", "values": ["people", "industrial"] } }
   */
  attributes: Record<string, ReportAttribute>;

  /**
   * @example ["LineString"]
   */
  geometries: ('LineString' | 'Point' | 'Polygon' | 'Unknown')[];

  /**
   * @example { "min": 12, "max": 15 }
   */
  zoom_levels: number[];
}

export interface ReportAttribute {
  /**
   * `true`, if all features of the parent `ReportEntry` define this attribute. Otherwise, `false`.
   */
  guaranteed: boolean;

  /**
   * The number of unique values across all features of the parent `ReportEntry` that define this attribute.
   */
  num_unique_values: number;
  /**
   * @example ["boolean", "string"]
   */
  types: string[];
  /**
   * @example ["people", "industrial"]
   */
  values: unknown[];
}
