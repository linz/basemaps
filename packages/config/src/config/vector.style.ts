import { VersionedConfig } from './base';

export type Sources = Record<
    string,
    {
        type: 'vector';
        url: string;
    }
>;

export interface StyleJson {
    id: string;

    /** style json version */
    version: number;

    /** style name */
    name: string;

    /** OPTIONAL - A base URL for retrieving the sprite image and metadata. */
    sprite?: string;

    /** OPTIONAL - A URL template for loading signed-distance-field glyph sets in PBF format.   */
    glyphs?: string;

    /** Data source specifications. */
    sources: Sources;

    /** Layers will be drawn in the order of this array. */
    layers: unknown[];
}

export type ConfigVectorStyle = VersionedConfig & StyleJson;
