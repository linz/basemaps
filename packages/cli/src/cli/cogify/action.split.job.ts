import { Epsg, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { CogStacJob, JobCreationContext } from '../../cog/cog.stac.job.js';
import { ProjectionLoader } from '../../cog/projection.loader.js';
import * as ulid from 'ulid';
import { getCutline } from './cutline.js';
import { CogJobFactory } from '../../cog/job.factory.js';

export class CommandMakeCog extends CommandLineAction {
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
    


    // Write the output job json
    const output = this.output.value;
    if (output) {
      fsa.write(output, JSON.stringify(outputs));
    }
  }
}
