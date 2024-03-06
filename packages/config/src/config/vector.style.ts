import { ConfigBase } from './base.js';

interface SourceVector {
  type: 'vector';
  url: string;
  attribution?: string;
}

interface SourceRaster {
  type: 'raster';
  tiles: string[];
  tileSize?: number;
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

interface SourceRasterDem {
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
}

export interface ConfigVectorStyle extends ConfigBase {
  style: StyleJson;
}
