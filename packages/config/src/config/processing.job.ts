import { BaseConfig } from './base.js';

export type ConfigProcessingJob = ProcessingJob | ProcessingJobComplete | ProcessingJobFailed;

export interface ProcessingJob extends BaseConfig {
  status: 'processing';
}

export interface ProcessingJobComplete extends BaseConfig {
  status: 'complete';
  /** Processed Imagery projection */
  tileMatrix: string;
  /** Processed TileSet Id */
  tileSet: string;
  /** Basemaps TileSet url */
  url: string;
}

export interface ProcessingJobFailed extends BaseConfig {
  status: 'failed';
  /** Job Batch processing error messages */
  error: string;
}
