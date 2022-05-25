import { TileMatrixSet } from '@basemaps/geo';
import { Env, fsa, LogConfig, LogType, Projection } from '@basemaps/shared';
import Batch from 'aws-sdk/clients/batch.js';
import { createHash } from 'crypto';
import { CogJob } from '../../cog/types.js';

const JobQueue = 'CogBatchJobQueue';
const JobDefinition = 'CogBatchJob';
const ChunkJobSizeLimit = 4097;

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
    fileNames.sort((a, b) => (a > b ? 1 : -1));
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

    // Calculate the total size to provision memory
    let res = 1;
    for (const name of names) {
      const tile = TileMatrixSet.nameToTile(name);
      const alignmentLevels = Projection.findAlignmentLevels(job.tileMatrix, tile, job.source.gsd);
      // Give 25% more memory to larger jobs
      res += Math.max(alignmentLevels - MagicAlignmentLevel, 0) * 0.25;
    }
    const memory = 3900 * res;

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

    const chunkJob: string[] = [];
    const stats = await Promise.all(
      job.output.files.map(async ({ name, width }) => {
        // Check existence of the output.
        const targetPath = job.getJobPath(`${name}.tiff`);
        const exists = await fsa.exists(targetPath);
        if (exists) {
          logger.info({ targetPath }, 'FileExists');
          return { names: [name], ok: true };
        }

        // Calculate the imagery size and chunk the small ones into one job.
        const size = width / job.output.gsd;
        if (size < ChunkJobSizeLimit) chunkJob.push(name);

        // Check existence of the job running.
        const jobName = BatchJob.id(job, [name]);
        const isRunning = runningJobs.get(jobName);
        if (isRunning) {
          logger.info({ jobName }, 'JobRunning');
          return { names: [name], ok: true };
        }

        return { names: [name], ok: false };
      }),
    );

    const toSubmit = stats.filter((f) => f.ok === false).map((c) => c.names);
    // Check existence of the chunk job running.
    const jobName = BatchJob.id(job, chunkJob);
    const isRunning = runningJobs.get(jobName);
    if (isRunning) {
      logger.info({ jobName }, 'JobRunning');
    } else {
      toSubmit.push(chunkJob);
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
}
