import { BaseConfig } from './base.js';

export enum JobStatus {
  Processing = 'processing',
  Complete = 'complete',
  Fail = 'fail',
}

export interface ConfigJob extends BaseConfig {
  /** Job Status for the imagery importing batch jobs */
  status: JobStatus;

  /** Job Batch processing error messages */
  error?: string;
}
