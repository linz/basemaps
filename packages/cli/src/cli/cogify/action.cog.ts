import { Config, Env, fsa, LogConfig, LoggerFatalError, LogType } from '@basemaps/shared';
import {
  CommandLineAction,
  CommandLineFlagParameter,
  CommandLineIntegerParameter,
  CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { createReadStream, promises as fs } from 'fs';
import { FeatureCollection } from 'geojson';
import { buildCogForName } from '../../cog/cog.js';
import { CogStacJob } from '../../cog/cog.stac.job.js';
import { CogVrt } from '../../cog/cog.vrt.js';
import { Cutline } from '../../cog/cutline.js';
import { CogJob } from '../../cog/types.js';
import { Gdal } from '../../gdal/gdal.js';
import { CliId } from '../base.cli.js';
import { makeTempFolder } from '../folder.js';
import path from 'path';
import { ProcessingJobComplete, ProcessingJobFailed } from '@basemaps/config';
import { prepareUrl } from '../util.js';

export class ActionCogCreate extends CommandLineAction {
  private job?: CommandLineStringParameter;
  private name?: CommandLineStringParameter;
  private commit?: CommandLineFlagParameter;
  private cogIndex?: CommandLineIntegerParameter;

  public constructor() {
    super({
      actionName: 'cog',
      summary: 'create a COG',
      documentation: 'Create a COG for the specified cog name',
    });
  }

  getName(job: CogJob): string | null {
    const { files } = job.output;
    const batchIndex = Env.getNumber(Env.BatchIndex, -1);
    if (batchIndex > -1) {
      const { name } = files[batchIndex];
      if (name == null) {
        throw new LoggerFatalError(
          { cogIndex: batchIndex, tileMax: files.length - 1 },
          'Failed to find cog name from batch index',
        );
      }
      return name;
    }

    const cogIndex = this.cogIndex?.value;
    if (cogIndex != null) {
      const { name } = files[cogIndex];
      if (name == null) {
        throw new LoggerFatalError({ cogIndex, tileMax: files.length - 1 }, 'Failed to find cog name from index');
      }
      return name;
    }
    const name = this.name?.value;
    if (name == null || !files.find((r) => r.name === name)) {
      throw new LoggerFatalError(
        { name, names: files.map((r) => r.name).join(', ') },
        'Name does not exist inside job',
      );
    }
    return name;
  }

  async onExecute(): Promise<void> {
    const jobFn = this.job?.value;
    if (jobFn == null) throw new Error('Missing job name');

    const job = await CogStacJob.load(jobFn);
    const isCommit = this.commit?.value ?? false;

    const logger = LogConfig.get().child({
      correlationId: job.id,
      imageryName: job.name,
      tileMatrix: job.tileMatrix.identifier,
    });

    LogConfig.set(logger);
    logger.info('CogCreate:Start');

    const gdalVersion = await Gdal.version(logger);
    logger.info({ version: gdalVersion }, 'CogCreate:GdalVersion');

    const name = this.getName(job);
    if (name == null) return;

    const targetPath = job.getJobPath(`${name}.tiff`);
    fsa.configure(job.output.location);

    const outputExists = await fsa.exists(targetPath);
    logger.info({ targetPath, outputExists }, 'CogCreate:CheckExists');
    // Output file exists don't try and overwrite it
    if (outputExists) {
      logger.warn({ targetPath }, 'CogCreate:OutputExists');
      return;
    }

    const tmpFolder = await makeTempFolder(`basemaps-${job.id}-${CliId}`);

    try {
      let cutlineJson: FeatureCollection | undefined;
      if (job.output.cutline != null) {
        const cutlinePath = job.getJobPath('cutline.geojson.gz');
        logger.info({ path: cutlinePath }, 'CogCreate:UsingCutLine');
        cutlineJson = await Cutline.loadCutline(cutlinePath);
      } else {
        logger.warn('NoCutLine');
      }
      const cutline = new Cutline(job.tileMatrix, cutlineJson, job.output.cutline?.blend, job.output.oneCogCovering);

      const tmpVrtPath = await CogVrt.buildVrt(tmpFolder, job, cutline, name, logger);

      if (tmpVrtPath == null) {
        logger.warn({ name }, 'CogCreate:NoMatchingSourceImagery');
        return;
      }

      const tmpTiff = fsa.join(tmpFolder, `${name}.tiff`);

      await buildCogForName(job, name, tmpVrtPath, tmpTiff, logger, isCommit);
      logger.info({ target: targetPath }, 'CogCreate:StoreTiff');
      if (isCommit) {
        await fsa.write(targetPath, createReadStream(tmpTiff));
        await this.checkJobStatus(job, logger);
      } else {
        logger.warn('DryRun:Done');
      }
    } catch (e) {
      if (job.processingId != null) {
        // Update job status if this is the processing job.
        const jobConfig = await Config.ProcessingJob.get(job.processingId);
        if (jobConfig == null) throw new Error('Unable to find Job Processing Config:' + job.processingId);
        const jobFailed = jobConfig as ProcessingJobFailed;
        jobFailed.status = 'failed';
        jobFailed.error = String(e);
        if (Config.ProcessingJob.isWriteable()) await Config.ProcessingJob.put(jobFailed);
        else throw new Error('Unable update the Processing Job status:' + jobFailed.id);
      }
    } finally {
      // Cleanup!
      await fs.rm(tmpFolder, { recursive: true });
    }
  }

  /** Check to see how many tiffs are remaining in the job */
  async checkJobStatus(job: CogStacJob, logger: LogType): Promise<void> {
    const basePath = job.getJobPath();
    const expectedTiffs = new Set<string>();
    const jobSize = job.output.files.length;
    for (const file of job.output.files) expectedTiffs.add(`${file.name}.tiff`);

    for await (const fileName of fsa.list(basePath)) {
      const basename = path.basename(fileName);
      // Look for tile tiffs only
      if (!basename.includes('-') || !basename.endsWith('.tiff')) continue;
      expectedTiffs.delete(basename);
    }

    if (expectedTiffs.size === 0) {
      const url = await prepareUrl(job);
      if (job.processingId != null) {
        // Update job status if this is the processing job.
        const jobConfig = await Config.ProcessingJob.get(job.processingId);
        if (jobConfig == null) throw new Error('Unable to find Job Processing Config:' + job.processingId);
        const jobComplete = jobConfig as ProcessingJobComplete;
        jobComplete.status = 'complete';
        jobComplete.tileMatrix = job.tileMatrix.identifier;
        jobComplete.url = url;
        if (Config.ProcessingJob.isWriteable()) await Config.ProcessingJob.put(jobConfig);
        else throw new Error('Unable update the Processing Job status:' + jobConfig.id);
      }
      logger.info({ tiffCount: jobSize, tiffTotal: jobSize, url }, 'CogCreate:JobComplete');
    } else {
      logger.info({ tiffCount: jobSize, tiffRemaining: expectedTiffs.size }, 'CogCreate:JobProgress');
    }
  }

  protected onDefineParameters(): void {
    this.job = this.defineStringParameter({
      argumentName: 'JOB',
      parameterLongName: '--job',
      description: 'Job config source to access',
      required: true,
    });

    this.name = this.defineStringParameter({
      argumentName: 'NAME',
      parameterLongName: '--name',
      description: 'cog name to process',
      required: false,
    });

    this.cogIndex = this.defineIntegerParameter({
      argumentName: 'COG_INDEX',
      parameterLongName: '--cog-index',
      description: 'index of cog to process',
      required: false,
    });

    this.commit = this.defineFlagParameter({
      parameterLongName: '--commit',
      description: 'Begin the transformation',
      required: false,
    });
  }
}
