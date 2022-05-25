import { TileMatrixSet } from '@basemaps/geo';
import { Env, fsa, LogConfig, LogType, Projection } from '@basemaps/shared';
import Batch from 'aws-sdk/clients/batch.js';
import { createHash } from 'crypto';
import { CogJob } from '../../cog/types.js';

const JobQueue = 'CogBatchJobQueue';
const JobDefinition = 'CogBatchJob';
const ChunkJobSizeLimit = 4097;
const MaxChunkJob = 10;

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
  /**
   * Create a id for a job
   *
   * This needs to be within `[a-Z_-]` upto 128 characters log
   * @param job job to process
   * @param fileNames output filename
   * @returns job id
   */
  static id(job: CogJob, fileNames: string[]): string {
    // Job names are uncontrolled so hash the name and grab a small slice to use as a identifier
    const jobName = createHash('sha256').update(job.name).digest('hex').slice(0, 16);
    fileNames.sort((a, b) => a.localeCompare(b));
    return `${job.id}-${jobName}-${fileNames.join('_')}`.slice(0, 128);
  }

  static async batchOne(
    jobPath: string,
    job: CogJob,
    batch: Batch,
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

    const batchJob = await batch
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
  static async getCurrentJobList(batch: Batch): Promise<Map<string, boolean>> {
    // For some reason AWS only lets us query one status at a time.
    const allStatuses = ['SUBMITTED', 'PENDING', 'RUNNABLE', 'STARTING', 'RUNNING', 'SUCCEEDED', 'FAILED'];
    const allJobs = await Promise.all(
      allStatuses.map((jobStatus) => batch.listJobs({ jobQueue: JobQueue, jobStatus }).promise()),
    );

    const okMap = new Map<string, boolean>();

    for (const status of allJobs) {
      for (const job of status.jobSummaryList) {
        if (job.status === 'FAILED' && okMap.get(job.jobName) !== true) {
          okMap.set(job.jobName, false);
        } else {
          okMap.set(job.jobName, true);
        }
      }
    }
    return okMap;
  }

  static async batchJob(job: CogJob, commit = false, logger: LogType): Promise<void> {
    const jobPath = job.getJobPath('job.json');
    if (!jobPath.startsWith('s3://')) {
      throw new Error(`AWS Batch collection.json have to be in S3, jobPath:${jobPath}`);
    }
    LogConfig.set(logger.child({ correlationId: job.id, imageryName: job.name }));

    const region = Env.get('AWS_DEFAULT_REGION') ?? 'ap-southeast-2';
    const batch = new Batch({ region });

    fsa.configure(job.output.location);
    const runningJobs = await BatchJob.getCurrentJobList(batch);

    // Prepare chunk job and individual jobs based on imagery size.
    const jobs = await this.getJobs(job, ChunkJobSizeLimit, MaxChunkJob);

    // Get all the existing output tiffs
    const targetPath = job.getJobPath();
    const existTiffs: string[] = [];
    for await (const fileName of fsa.list(job.getJobPath())) {
      if (fileName.endsWith('.tiff')) existTiffs.push(fileName);
    }

    const toSubmit: string[][] = [];
    for (const names of jobs) {
      // Check existence of batch job running
      const jobName = BatchJob.id(job, names);
      const isRunning = runningJobs.get(jobName);
      if (isRunning) {
        logger.info({ jobName }, 'JobRunning');
        continue;
      }

      // Check existence of all the output tiffs.
      let allExists = true;
      for (const name of names) {
        if (!existTiffs.includes(job.getJobPath(`${name}.tiff`))) allExists = false;
      }
      if (allExists) {
        logger.info({ targetPath, names }, 'FileExists');
        continue;
      }

      // Ready to submit
      toSubmit.push(names);
    }

    if (toSubmit.length === 0) {
      logger.info('NoJobs');
      return;
    }

    logger.info(
      {
        jobTotal: job.output.files.length,
        jobLeft: toSubmit.length,
        jobQueue: JobQueue,
        jobDefinition: JobDefinition,
      },
      'JobSubmit',
    );

    for (const names of toSubmit) {
      const jobStatus = await BatchJob.batchOne(jobPath, job, batch, names, commit);
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
  static async getJobs(job: CogJob, chunkSizeLimit: number, maxChunkJob: number): Promise<string[][]> {
    const jobs: string[][] = [];
    let chunkJob: string[] = [];
    for (const file of job.output.files) {
      const imageSize = file.width / job.output.gsd;
      if (imageSize > chunkSizeLimit) {
        jobs.push([file.name]);
      } else {
        chunkJob.push(file.name);
        if (chunkJob.length >= maxChunkJob) {
          jobs.push(chunkJob);
          chunkJob = [];
        }
      }
    }
    if (chunkJob.length > 0) jobs.push(chunkJob);
    return jobs;
  }
}
