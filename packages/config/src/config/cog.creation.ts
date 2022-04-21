import { BaseConfig } from './base.js';

export enum JobStatus {
  Processing = 'processing',
  Complete = 'complete',
}

export type CogCreation = CogCreationJob | CogCreationFailed;

export interface CogCreationJob extends BaseConfig {
  /** Job Status for the imagery importing batch jobs */
  status: JobStatus;
}

export interface CogCreationFailed extends BaseConfig {
  status: 'failed';
  /** Job Batch processing error messages */
  error: string;
}
