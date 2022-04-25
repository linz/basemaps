import { BaseConfig } from './base.js';

export enum JobStatus {
  Processing = 'processing',
  Complete = 'complete',
}

export type ConfigProcessingJob = ProcessingJob | ProcessingJobFailed;

export interface ProcessingJob extends BaseConfig {
  /** Job Status for the imagery importing batch jobs */
  status: JobStatus;
}

export interface ProcessingJobFailed extends BaseConfig {
  status: 'failed';
  /** Job Batch processing error messages */
  error: string;
}
