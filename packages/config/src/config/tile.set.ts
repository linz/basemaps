import { EpsgCode, ImageFormat, VectorFormat } from '@basemaps/geo';
import { BaseConfig } from './base.js';

export enum TileSetType {
  Raster = 'raster',
  Vector = 'vector',
}

export interface ConfigLayer extends Partial<Record<EpsgCode, string>> {
  /** Layer name*/
  name: string;

  /** Minimal zoom to show the layer @default 0 */
  minZoom?: number;

  /** Max zoom to show the layer @default 30 */
  maxZoom?: number;
}

export type TileResizeKernel = 'nearest' | 'lanczos3' | 'lanczos2';

export interface ConfigTileSetBase extends BaseConfig {
  title?: string;
  description?: string;

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
  /** Preferred imagery format to use */
  format: ImageFormat;

  /** Background to render for areas where there is no data */
  background?: { r: number; g: number; b: number; alpha: number };

  /** When scaling tiles in the rendering process what kernel to use */
  resizeKernel?: { in: TileResizeKernel; out: TileResizeKernel };
}

export interface ConfigTileSetVector extends ConfigTileSetBase {
  type: TileSetType.Vector;
  format: VectorFormat;
}

export type ConfigTileSet = ConfigTileSetVector | ConfigTileSetRaster;
