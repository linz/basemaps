import { TileMatrixSet } from '@basemaps/geo';
import { Env, fsa, LogConfig, LogType, Projection } from '@basemaps/shared';
import Batch from 'aws-sdk/clients/batch.js';
import { createHash } from 'crypto';
import { CogJob } from '../../cog/types.js';

const JobQueue = 'CogBatchJobQueue';
const JobDefinition = 'CogBatchJob';

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
   * @param fileName output filename
   * @returns job id
   */
  static id(job: CogJob, fileName: string): string {
    // Job names are uncontrolled so hash the name and grab a small slice to use as a identifier
    const jobName = createHash('sha256').update(job.name).digest('hex').slice(0, 16);
    return `${job.id}-${jobName}-${fileName}`.slice(0, 128);
  }

  static async batchOne(
    jobPath: string,
    job: CogJob,
    batch: Batch,
    name: string,
    isCommit: boolean,
  ): Promise<{ jobName: string; jobId: string; memory: number }> {
    const jobName = BatchJob.id(job, name);
    const tile = TileMatrixSet.nameToTile(name);
    const alignmentLevels = Projection.findAlignmentLevels(job.tileMatrix, tile, job.source.gsd);
    // Give 25% more memory to larger jobs
    const resDiff = 1 + Math.max(alignmentLevels - MagicAlignmentLevel, 0) * 0.25;
    const memory = 3900 * resDiff;

    if (!isCommit) {
      return { jobName, jobId: '', memory };
    }

    const commandStr = ['-V', 'cog', '--job', jobPath, '--commit', '--name', name];

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

  static async batchJob(job: CogJob, commit = false, oneCog: string | undefined, logger: LogType): Promise<void> {
    const jobPath = job.getJobPath('job.json');
    if (!jobPath.startsWith('s3://')) {
      throw new Error(`AWS Batch collection.json have to be in S3, jobPath:${jobPath}`);
    }
    LogConfig.set(logger.child({ correlationId: job.id, imageryName: job.name }));

    const region = Env.get('AWS_DEFAULT_REGION') ?? 'ap-southeast-2';
    const batch = new Batch({ region });

    fsa.configure(job.output.location);
    const runningJobs = await BatchJob.getCurrentJobList(batch);

    const stats = await Promise.all(
      job.output.files.map(async ({ name }) => {
        if (oneCog != null && oneCog !== name) return { name, ok: true };
        const jobName = BatchJob.id(job, name);
        const isRunning = runningJobs.get(jobName);
        if (isRunning) {
          logger.info({ jobName }, 'JobRunning');
          return { name, ok: true };
        }

        const targetPath = job.getJobPath(`${name}.tiff`);
        const exists = await fsa.exists(targetPath);
        if (exists) logger.info({ targetPath }, 'FileExists');
        return { name, ok: exists };
      }),
    );

    const toSubmit = stats.filter((f) => f.ok === false).map((c) => c.name);
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

    for (const name of toSubmit) {
      const jobStatus = await BatchJob.batchOne(jobPath, job, batch, name, commit);
      logger.info(jobStatus, 'JobSubmitted');
    }

    if (!commit) {
      logger.warn('DryRun:Done');
      return;
    }
  }
}
