import { fsa, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { CogStacJob } from '../../cog/cog.stac.job.js';
import { BatchJob } from './batch.job.js';
import { basename } from 'path';

export class CommandSplitJob extends CommandLineAction {
  private job: CommandLineStringParameter;
  private output: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'split-job',
      summary: 'Import Basemaps imagery from s3 buckets',
      documentation: 'Given a valid job.json from make.cog and split to chunkd sub jobs.',
    });
  }

  protected onDefineParameters(): void {
    this.job = this.defineStringParameter({
      argumentName: 'JOB',
      parameterShortName: '-j',
      parameterLongName: '--job',
      description: 'Path of job json to split.',
      required: true,
    });
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterShortName: '-o',
      parameterLongName: '--output',
      description: 'Output split.json path',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const jobLocation = this.job.value;
    if (jobLocation == null) throw new Error('Please provide a valid job json path');

    const job = await CogStacJob.load(jobLocation);
    logger.info({ jobLocation }, 'SplitJob:LoadingJob');

    // Get all the existing output tiffs
    const existTiffs: Set<string> = new Set();
    for await (const fileName of fsa.list(job.getJobPath())) {
      if (fileName.endsWith('.tiff')) existTiffs.add(basename(fileName));
    }

    const runningJobs = await BatchJob.getCurrentJobList(job, logger);
    for (const tiffName of runningJobs) existTiffs.add(`${tiffName}.tiff`);

    // Prepare chunk job and individual jobs based on imagery size.
    const jobs = await BatchJob.getJobs(job, existTiffs, logger);

    if (jobs.length === 0) {
      logger.info('NoJobs');
      return;
    }

    logger.info({ jobTotal: job.output.files.length, jobLeft: jobs.length }, 'SplitJob:ChunkedJobs');

    // Write the output job json
    const output = this.output.value;
    if (output) {
      fsa.write(output, JSON.stringify(jobs));
    }
  }
}
