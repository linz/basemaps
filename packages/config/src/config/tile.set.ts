import { EpsgCode, ImageFormat, VectorFormat } from '@basemaps/geo';

import { ConfigBase } from './base.js';

export enum TileSetType {
  Raster = 'raster',
  Vector = 'vector',
}

export interface ConfigLayer extends Partial<Record<EpsgCode, string>> {
  /** Layer name*/
  name: string;

  /** Human friendly display name for the layer */
  title: string;

  /**
   * Keywords used to categorize the tileset
   * @example
   * - Bathymetry
   * - Satellite Imagery
   */
  category?: string;

  /** Minimal zoom to show the layer @default 0 */
  minZoom?: number;

  /** Max zoom to show the layer @default 30 */
  maxZoom?: number;
}

export type TileResizeKernel = 'nearest' | 'lanczos3' | 'lanczos2';

export interface ConfigTileSetBase extends ConfigBase {
  /** Human friendly display name for the tileset */
  title: string;

  /** Human friendly description of the tileset */
  description?: string;

  /**
   * Keywords used to categorize the tileset
   * @example
   * - Basemap
   */
  category?: string;

  /**
   * The rendering layer for imagery in this tileset
   *
   * This array is not sorted in the rendering order
   * This should be sorted into the rendering order using
   */
  layers: ConfigLayer[];

  /** Minimum zoom level for this tileSet @default 0 */
  minZoom?: number;

  /** Maximum zoom level for this tileSet @default 30 */
  maxZoom?: number;
}

export interface ConfigTileSetRaster extends ConfigTileSetBase {
  type: TileSetType.Raster;

  /** 
   * TODO: This is for supporting vector format with the new config Structure on Basemaps V7. 
   * We can remove this after release New Basemaps version.
  */
  format?: ImageFormat;

  /** Background to render for areas where there is no data */
  background?: { r: number; g: number; b: number; alpha: number };

  /** When scaling tiles in the rendering process what kernel to use */
  resizeKernel?: { in: TileResizeKernel; out: TileResizeKernel };

  /**
   * Configure how the tile set is rendered,
   * if this is not defined a default RGBA output will be generated
   */
  outputs?: ConfigTileSetRasterOutput[];
}

export interface ConfigTileSetRasterOutput {
  /** Human friendly description of the output */
  title: string;

  /**
   * Common name for the configuration
   *
   * @example "terrain-rgb", "color-ramp"
   */
  name: string;

  /**
   * Raster processing pipeline, for configuration on how to convert the source into a RGBA output
   */
  pipeline?: ConfigRasterPipeline[];

  /**
   * Raster output format
   * if none is provided it is assumed to be a RGBA output allowing all image formats
   */
  output?: {
    /**
     * Allowed output file format to use
     *
     * Will default to all image formats
     * if "lossless" is set then lossless image formats
     *
     * @default ImageFormat[] - All Image formats
     */
    type?: ImageFormat[];
    /**
     * should the output be lossless
     *
     * @default false
     */
    lossless?: boolean;
    /**
     * Background to render for areas where there is no data, falls back to
     * {@link ConfigTileSetRaster.background} if not defined
     */
    background?: { r: number; g: number; b: number; alpha: number };

    /**
     * When scaling tiles in the rendering process what kernel to use
     *
     * will fall back to {@link ConfigTileSetRaster.background} if not defined
     */
    resizeKernel?: { in: TileResizeKernel; out: TileResizeKernel };
  };
}

export type ConfigRasterPipeline = ConfigRasterPipelineTerrainRgb | ConfigRasterPipelineColorRamp;

export interface ConfigRasterPipelineTerrainRgb {
  type: 'terrain-rgb';
}

export interface ConfigRasterPipelineColorRamp {
  type: 'color-ramp';
}

export interface ConfigTileSetVector extends ConfigTileSetBase {
  type: TileSetType.Vector;

  /**
   * TODO: This is for supporting vector format with the new config Structure on Basemaps V7.
   * We can remove this after release New Basemaps version.
   */
  format?: VectorFormat;
}

export type ConfigTileSet = ConfigTileSetVector | ConfigTileSetRaster;
