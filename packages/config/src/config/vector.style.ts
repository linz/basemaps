import { BaseConfig } from './base';

interface SourceVector {
    type: 'vector';
    url: string;
}

interface SourceRaster {
    type: 'raster';
    tiles: string[];
    tileSize?: number;
    minzoom?: number;
    maxzoom?: number;
}

type Source = SourceVector | SourceRaster;

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
    layers: unknown[];
}

export interface ConfigVectorStyle extends BaseConfig {
    style: StyleJson;
}
