import { BaseConfig } from './base.js';

export enum JobStatus {
  Processing = 'processing',
  Complete = 'complete',
  Fail = 'failed',
}

export type ConfigProcessingJob = ProcessingJob | ProcessingJobComplete | ProcessingJobFailed;

export interface ProcessingJob extends BaseConfig {
  status: JobStatus;
  /** Processed Imagery projection */
  tileMatrix: string;
  /** Processed TileSet Id */
  tileSet: string;
  /** Basemaps TileSet url */
}

export interface ProcessingJobComplete extends ProcessingJob {
  status: JobStatus.Complete;
  url: string;
}

export interface ProcessingJobFailed extends ProcessingJob {
  status: JobStatus.Fail;
  /** Job Batch processing error messages */
  error: string;
}
