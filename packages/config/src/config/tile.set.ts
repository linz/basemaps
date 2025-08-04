import { EpsgCode, ImageFormat, VectorFormat } from '@basemaps/geo';
import { z } from 'zod';

import { ConfigBase } from './base.js';
import { ConfigTileSetOutputParser } from './tile.set.pipeline.js';

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

  /** Array containing any tileSet aliases */
  aliases?: string[];
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

export type ConfigTileSetRasterOutput = z.infer<typeof ConfigTileSetOutputParser>;

export interface ConfigRasterPipeline {
  /**
   * type of pipeline function
   *
   * @example "terrain-rgb"
   */
  type: string;
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
