import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';

import { ConfigBase } from './base.js';

/**
 * Default Terrain exaggeration settings for different projection
 */
export const DefaultExaggeration = {
  [Nztm2000QuadTms.identifier]: 4.4,
  [GoogleTms.identifier]: 1.2,
};

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

  /** OPTIONAL - A global modifier that elevates layers and markers based on a DEM data source */
  terrain?: Terrain;
}

export interface ConfigVectorStyle extends ConfigBase {
  style: StyleJson;
}
