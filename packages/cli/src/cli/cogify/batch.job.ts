import { TileMatrixSet } from '@basemaps/geo';
import { Env, fsa, LogConfig, LogType, Projection } from '@basemaps/shared';
import Batch from 'aws-sdk/clients/batch.js';
import { createHash } from 'crypto';
import { basename } from 'path';
import { CogJob } from '../../cog/types.js';

const JobQueue = 'CogBatchJobQueue';
const JobDefinition = 'CogBatchJob';
const ChunkJobMax = 2000;
const ChunkLargeUnit = 200; // Up to 10 large files in one job
const ChunkMiddleUnit = 50; // Up to 40 middle files in one job
const ChunkSmallUnit = 20; // Up to 100 small files in one job

/** The base alignment level used by GDAL, Tiffs that are bigger or smaller than this should scale the compute resources */
const MagicAlignmentLevel = 7;

const ResolutionRegex = /((?:\d[\.\-])?\d+)m/;
/**
 * Attempt to parse a resolution from a imagery name
 * @example `wellington_urban_2017_0.10m` -> 100
 * @param name Imagery name to parse
 * @returns resolution (millimeters), -1 for failure to parse
 */
export function extractResolutionFromName(name: string): number {
  const matches = name.match(ResolutionRegex);
  if (matches == null) return -1;
  return parseFloat(matches[1].replace('-', '.')) * 1000;
}

export class BatchJob {
  static _batch: Batch;
  static get batch(): Batch {
    if (this._batch) return this._batch;
    const region = Env.get('AWS_REGION') ?? Env.get('AWS_DEFAULT_REGION') ?? 'ap-southeast-2';
    this._batch = new Batch({ region });
    return this._batch;
  }
  /**
   * Create a id for a job
   *
   * This needs to be within `[a-Z_-]` upto 128 characters log
   * @param job job to process
   * @param fileNames output filename
   * @returns job id
   */
  static id(job: CogJob, fileNames?: string[]): string {
    // Job names are uncontrolled so hash the name and grab a small slice to use as a identifier
    const jobName = createHash('sha256').update(job.name).digest('hex').slice(0, 16);
    if (fileNames == null) return `${job.id}-${jobName}-`;
    fileNames.sort((a, b) => a.localeCompare(b));
    return `${job.id}-${jobName}-${fileNames.length}x-${fileNames.join('_')}`.slice(0, 128);
  }

  static async batchOne(
    jobPath: string,
    job: CogJob,
    names: string[],
    isCommit: boolean,
  ): Promise<{ jobName: string; jobId: string; memory: number }> {
    const jobName = BatchJob.id(job, names);

    let memory = 3900;
    if (names.length === 1) {
      // Calculate the larger file to provision memory if there is only one imagery in job.
      const tile = TileMatrixSet.nameToTile(names[0]);
      const alignmentLevels = Projection.findAlignmentLevels(job.tileMatrix, tile, job.source.gsd);
      // Give 25% more memory to larger jobs
      const resDiff = 1 + Math.max(alignmentLevels - MagicAlignmentLevel, 0) * 0.25;
      memory *= resDiff;
    }

    if (!isCommit) {
      return { jobName, jobId: '', memory };
    }

    let commandStr = ['-V', 'cog', '--job', jobPath, '--commit'];
    for (const name of names) commandStr = commandStr.concat(['--name', name]);

    const batchJob = await this.batch
      .submitJob({
        jobName,
        jobQueue: JobQueue,
        jobDefinition: JobDefinition,
        containerOverrides: {
          memory,
          command: commandStr,
        },
        retryStrategy: { attempts: 3 },
      })
      .promise();
    return { jobName, jobId: batchJob.jobId, memory };
  }

  /**
   * List all the current jobs in batch and their statuses
   * @returns a map of JobName to if their status is "ok" (not failed)
   */
  static async getCurrentJobList(job: CogJob, logger: LogType): Promise<Set<string>> {
    const jobPrefix = BatchJob.id(job);
    // For some reason AWS only lets us query one status at a time.
    const allStatuses = ['SUBMITTED', 'PENDING', 'RUNNABLE', 'STARTING', 'RUNNING' /* 'SUCCEEDED' */];
    // Succeeded is not needed as we check to see if the output file exists, if it succeeds and the output file doesn't exist then something has gone wrong
    const allJobs = await Promise.all(
      allStatuses.map((jobStatus) => this.batch.listJobs({ jobQueue: JobQueue, jobStatus }).promise()),
    );

    const jobIds = new Set<string>();

    // Find all the relevant jobs that start with our job prefix
    for (const status of allJobs) {
      for (const job of status.jobSummaryList) {
        if (!job.jobName.startsWith(jobPrefix)) continue;
        jobIds.add(job.jobId);
      }
    }

    // Inspect all the jobs for what files are being "processed"
    const tiffs = new Set<string>();
    let allJobIds = [...jobIds];
    while (allJobIds.length > 0) {
      logger.info({ jobCount: allJobIds.length }, 'JobFetch');
      const jobList = allJobIds.slice(0, 100);
      allJobIds = allJobIds.slice(100);
      const describedJobs = await this.batch.describeJobs({ jobs: jobList }).promise();
      if (describedJobs.jobs == null) continue;
      for (const job of describedJobs.jobs) {
        const jobCommand = job.container?.command;
        if (jobCommand == null) continue;

        // Extract the tiff names from the job command
        for (let i = 0; i < jobCommand.length; i++) {
          if (jobCommand[i] === '--name') tiffs.add(jobCommand[i + 1]);
        }
      }
    }

    return tiffs;
  }

  static async batchJob(job: CogJob, commit = false, logger: LogType): Promise<void> {
    const jobPath = job.getJobPath('job.json');
    if (!jobPath.startsWith('s3://')) {
      throw new Error(`AWS Batch collection.json have to be in S3, jobPath:${jobPath}`);
    }
    LogConfig.set(logger.child({ correlationId: job.id, imageryName: job.name }));

    fsa.configure(job.output.location);

    // Get all the existing output tiffs
    const existTiffs: Set<string> = new Set();
    for await (const fileName of fsa.list(job.getJobPath())) {
      if (fileName.endsWith('.tiff')) existTiffs.add(basename(fileName));
    }

    const runningJobs = await this.getCurrentJobList(job, logger);
    for (const tiffName of runningJobs) existTiffs.add(`${tiffName}.tiff`);

    // Prepare chunk job and individual jobs based on imagery size.
    const jobs = await this.getJobs(job, existTiffs, logger);

    if (jobs.length === 0) {
      logger.info('NoJobs');
      return;
    }

    logger.info(
      {
        jobTotal: job.output.files.length,
        jobLeft: jobs.length,
        jobQueue: JobQueue,
        jobDefinition: JobDefinition,
      },
      'JobSubmit',
    );

    for (const names of jobs) {
      const jobStatus = await BatchJob.batchOne(jobPath, job, names, commit);
      logger.info(jobStatus, 'JobSubmitted');
    }

    if (!commit) {
      logger.warn('DryRun:Done');
      return;
    }
  }

  /**
   * Prepare the jobs from job files, and chunk the small images into single
   * @returns List of jobs including single job and chunk jobs.
   */
  static getJobs(job: CogJob, existing: Set<string>, log: LogType, maxChunkUnit = ChunkJobMax): string[][] {
    const jobs: string[][] = [];
    let chunkJob: string[] = [];
    let chunkUnit = 0; // Calculate the chunkUnit based on the size
    for (const file of job.output.files) {
      const outputFile = `${file.name}.tiff`;
      if (existing.has(outputFile)) {
        log.debug({ fileName: outputFile }, 'Skip:Exists');
        continue;
      }

      const imageSize = file.width / job.output.gsd;
      if (imageSize > 16385) {
        jobs.push([file.name]);
      } else if (imageSize > 8193) {
        chunkJob.push(file.name);
        chunkUnit += ChunkLargeUnit;
      } else if (imageSize > 4097) {
        chunkJob.push(file.name);
        chunkUnit += ChunkMiddleUnit;
      } else {
        chunkJob.push(file.name);
        chunkUnit += ChunkSmallUnit;
      }
      if (chunkUnit >= maxChunkUnit) {
        jobs.push(chunkJob);
        chunkJob = [];
        chunkUnit = 0;
      }
    }
    if (chunkJob.length > 0) jobs.push(chunkJob);

    return jobs;
  }
}
