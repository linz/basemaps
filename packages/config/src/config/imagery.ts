import { NamedBounds, BoundingBox, EpsgCode } from '@basemaps/geo';
import { BaseConfig } from './base.js';

export interface ConfigImagery extends BaseConfig {
  projection: EpsgCode;

  /** tileMatrix identifier */
  tileMatrix: string;

  /** The tile for the imagery set and showing name if not defined */
  title: string;

  /** Categorize imagery into a group, eg Rural vs Urban vs Satellite vs DEM */
  category?: string;

  /** The location of the COGs like s3://basemaps-cogs/3857/aerial/jobId123 */
  uri: string;

  /** the bounding box of all the COGs */
  bounds: BoundingBox;

  /** list of file basenames and their bounding box */
  files: NamedBounds[];

  /** Separate overview cache */
  overviews?: ConfigImageryOverview;
}

export interface ConfigImageryOverview {
  /** Path to overview archive */
  path: string;
  /**
   * Minium zoom level of overviews
   * @example 0 means tiles for z0 exist in this overview archive
   */
  minZoom: number;
  /**
   *  Maximum zoom level of overviews
   * @example
   * 15 means tiles for z15 exist in this overview archive
   */
  maxZoom: number;
}
