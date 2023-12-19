import { BoundingBox, EpsgCode, NamedBounds } from '@basemaps/geo';

import { BaseConfig } from './base.js';

export interface ConfigDataset extends BaseConfig {
  /**
   *Type of the dataset
   */
  type: 'tiff' | 'tar';

  /**
   * The location of the source data like s3://basemaps-cogs/3857/aerial/jobId123/
   *
   * This needs to have a trailing slash for folder
   */
  url: string;

  /**
   * EPSG code of the dataset
   */
  projection: EpsgCode;

  /**
   * Bounding box of the dataset
   */
  bounds: BoundingBox;

  /**
   * List of files in the dataset with their bounding boxes
   */
  files: NamedBounds;
}
