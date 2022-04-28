import { EpsgCode } from '@basemaps/geo';
import { BaseConfig } from './base.js';

export enum JobStatus {
  Processing = 'processing',
  Complete = 'complete',
}

export interface TileSet {
  projection: EpsgCode;
  /** Imagery processing id */
  id: string;
}

export interface TileSetComplete extends TileSet {
  /** Imagery url after job processing complete */
  url: string;
}

export type ConfigProcessingJob = ProcessingJob | ProcessingJobCompleted | ProcessingJobFailed;

export interface ProcessingJob extends BaseConfig {
  /** Job Status for the imagery importing batch jobs */
  status: 'processing';
  tileSets: TileSet[];
}

export interface ProcessingJobCompleted extends BaseConfig {
  /** Job Status for the imagery importing batch jobs */
  status: 'complete';
  tileSets: TileSetComplete[];
}

export interface ProcessingJobFailed extends BaseConfig {
  status: 'failed';
  /** Job Batch processing error messages */
  error: string;
}
