import { VersionedConfig } from './base';

export enum TileSetType {
    Raster = 'raster',
    Vector = 'vector',
}

export interface ConfigImageryRule {
    /** Minimal zoom to show the layer @default 0 */
    minZoom: number;

    /** Max zoom to show the layer @default 32 */
    maxZoom: number;

    /** Rendering priority, lower numbers are rendered onto the canvas first */
    priority: number;

    /** Unique rule id  (prefix: ir_)*/
    ruleId: string;

    /** Unique imagery id  (prefix: im_)*/
    imgId: string;
}

export type TileResizeKernel = 'nearest' | 'lanczos3' | 'lanczos2';
export const DefaultBackground = { r: 0, g: 0, b: 0, alpha: 0 };

export interface ConfigTileSetRaster extends VersionedConfig {
    v: 2;

    /** New records will have this set */
    type: TileSetType.Raster;
    /**
     * The rendering rules for imagery in this tileset
     *
     * This array is not sorted in the rendering order
     * This should be sorted into the rendering order using
     */
    rules: ConfigImageryRule[];

    /** Background to render for areas where there is no data */
    background?: { r: number; g: number; b: number; alpha: number };

    /** When scaling tiles in the rendering process what kernel to use */
    resizeKernel?: { in: TileResizeKernel; out: TileResizeKernel };
}

export interface ConfigTileSetVector extends VersionedConfig {
    v: 2;

    type: TileSetType.Vector;
    /**
     * The xyz urls for the layers
     */
    layers: string[];
}

export type ConfigTileSet = ConfigTileSetVector | ConfigTileSetRaster;
