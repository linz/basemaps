export interface Styling {
  minZoom: number;
  maxZoom: number;
  detail?: number;
}

export type Schema = Record<string, string | boolean>;

export type Attributes = Record<string, string>;

export type SpecialTag = { condition: string; tags: Schema };

export type Simplify = { style: Styling; tolerance: number | undefined };

/**
 * Layer interface for lds layer config metadata
 */
export interface Layer {
  /** LDS layer id */
  id: string;

  /** layer name */
  name: string;

  /** For external data if exists, we use this path to read data */
  path?: string;

  /** new tags added to layer, with key value pair, like Class:Wood */
  schema: Schema;

  /** existing attributes to keep, with key(existing attribute), value(renamed attribute), if key !== value, map the attribute name to value */
  attributes?: Attributes;

  /** layer zoom level and details */
  style: Styling;

  /** Generalization setting for multiple zoom levels tolerance */
  simplify?: Simplify[];

  /** Tippecanoe transform options */
  tippecanoe?: string[];

  metrics?: { input: number; output: number };
}
