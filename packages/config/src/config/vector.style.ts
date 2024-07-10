import { ConfigBase } from './base.js';

export interface SourceVector {
  type: 'vector';
  url: string;
  attribution?: string;
}

export interface SourceRaster {
  type: 'raster';
  tiles: string[];
  tileSize?: number;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

export interface SourceRasterDem {
  type: 'raster-dem';
  tiles: string[];
  tileSize?: number;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

/**
 * https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/
 */
export interface Layer {
  id: string;
  type: string;
  filter?: unknown[];
  layout?: unknown;
  minzoom?: number;
  maxzoom?: number;
  metadata?: unknown;
  paint?: unknown;
  source?: string;
  'source-layer'?: string;
}

/** Sky MapLibre Style Spec, all valuables support interpolate expressions, as unknown format */
export interface Sky {
  /** The base color for the sky. Optional Defaults to #88C6FC */
  'sky-color'?: unknown;
  /** The base color at the horizon. Optional Defaults to #ffffff */
  'horizon-color'?: unknown;
  /** The base color for the fog. Requires 3D terrain. Optional Defaults to #ffffff */
  'fog-color'?: unknown;
  /** How to blend the fog over the 3D terrain. Optional number in range [0, 1]. Defaults to 0.5 */
  'fog-ground-blend'?: unknown;
  /** How to blend the fog color and the horizon color. Optional number in range [0, 1]. Defaults to 0.8. */
  'horizon-fog-blend'?: unknown;
  /** How to blend the the sky color and the horizon color. Optional number in range [0, 1]. Defaults to 0.8. */
  'sky-horizon-blend'?: unknown;
  /** How to blend the atmosphere. Optional number in range [0, 1]. Defaults to 0.8. */
  'atmosphere-blend'?: unknown;
}

export interface Terrain {
  source: string;
  exaggeration: number;
}

export type Source = SourceVector | SourceRaster | SourceRasterDem;

export type Sources = Record<string, Source>;

export interface StyleJson {
  id: string;

  /** style json version */
  version: number;

  /** style name */
  name: string;

  /** OPTIONAL - Arbitrary properties useful to track with the stylesheet, but do not influence rendering. */
  metadata?: unknown;

  /** OPTIONAL - A base URL for retrieving the sprite image and metadata. */
  sprite?: string;

  /** OPTIONAL - A URL template for loading signed-distance-field glyph sets in PBF format.   */
  glyphs?: string;

  /** Data source specifications. */
  sources: Sources;

  /** Layers will be drawn in the order of this array. */
  layers: Layer[];

  /** The map's sky configuration */
  sky?: Sky;

  /** OPTIONAL - A global modifier that elevates layers and markers based on a DEM data source */
  terrain?: Terrain;
}

export interface ConfigVectorStyle extends ConfigBase {
  style: StyleJson;
}
