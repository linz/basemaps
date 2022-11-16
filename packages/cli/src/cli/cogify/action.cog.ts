import { Env, fsa, getDefaultConfig, LogConfig, LoggerFatalError, LogType } from '@basemaps/shared';
import { CliId } from '@basemaps/shared/build/cli/base.js';
import {
  CommandLineAction,
  CommandLineFlagParameter,
  CommandLineIntegerListParameter,
  CommandLineStringListParameter,
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
import { makeTempFolder, makeTiffFolder } from '../folder.js';
import path from 'path';
import { insertConfigImagery, insertConfigTileSet } from './imagery.config.js';
import { JobStatus, ProcessingJobComplete, ProcessingJobFailed } from '@basemaps/config';
import { prepareUrl } from '../util.js';

export class CommandCogCreate extends CommandLineAction {
  private job?: CommandLineStringParameter;
  private name?: CommandLineStringListParameter;
  private commit?: CommandLineFlagParameter;
  private cogIndex?: CommandLineIntegerListParameter;

  public constructor() {
    super({
      actionName: 'cog',
      summary: 'create a COG',
      documentation: 'Create a COG for the specified cog name',
    });
  }

  parseName(name: string): string[] {
    // Name could both be a string or a array type of string
    try {
      return JSON.parse(name);
    } catch (e) {
      return [name];
    }
  }

  getNames(job: CogJob): Set<string> | null {
    const output: Set<string> = new Set<string>();
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
      output.add(name);
      return output;
    }

    const cogIndex = this.cogIndex?.values;
    if (cogIndex != null && cogIndex.length > 0) {
      for (const i of cogIndex) {
        if (i < 0 || i >= files.length) {
          throw new LoggerFatalError({ cogIndex: i, tileMax: files.length - 1 }, 'Failed to find cog name from index');
        }
        const { name } = files[i];
        output.add(name);
      }

      return output;
    }

    const names = this.name?.values;
    if (names != null) {
      for (const nameStr of names) {
        const nameArr = this.parseName(nameStr);
        for (const name of nameArr) {
          if (!files.find((r) => r.name === name))
            throw new LoggerFatalError(
              { name, names: files.map((r) => r.name).join(', ') },
              'Name does not exist inside job',
            );
          output.add(name);
        }
      }
    }

    return output;
  }

  async onExecute(): Promise<void> {
    const jobLocation = this.job?.value;
    if (jobLocation == null) throw new Error('Missing job name');

    const cfg = getDefaultConfig();

    const isCommit = this.commit?.value ?? false;
    const job = await CogStacJob.load(jobLocation);

    const logger = LogConfig.get().child({
      correlationId: job.id,
      imageryName: job.name,
      tileMatrix: job.tileMatrix.identifier,
    });

    LogConfig.set(logger);
    logger.info('CogCreate:Start');

    const gdalVersion = await Gdal.version(logger);
    logger.info({ gdalVersion }, 'CogCreate:GdalVersion');

    const names = this.getNames(job);
    if (names == null || names.size === 0) return;

    const tmpFolder = await makeTempFolder(`basemaps-${job.id}-${CliId}`);

    try {
      for (const name of names) {
        const tiffJob = await CogStacJob.load(jobLocation);
        await this.processTiff(tiffJob, name, tmpFolder, isCommit, logger.child({ tiffName: name }));
      }
    } catch (e) {
      const processingId = job.json.processingId;
      if (processingId != null) {
        // Update job status if this is the processing job.
        const jobConfig = await cfg.ProcessingJob.get(processingId);
        if (jobConfig == null) throw new Error('Unable to find Job Processing Config:' + processingId);
        const jobFailed = jobConfig as ProcessingJobFailed;
        jobFailed.status = JobStatus.Fail;
        jobFailed.error = String(e);
        if (cfg.ProcessingJob.isWriteable()) await cfg.ProcessingJob.put(jobFailed);
        else throw new Error('Unable update the Processing Job status:' + jobFailed.id);
      }

      // Ensure the error is thrown
      throw e;
    } finally {
      // Cleanup!
      await fs.rm(tmpFolder, { recursive: true });
    }
  }

  async processTiff(
    job: CogStacJob,
    tiffName: string,
    tmpFolder: string,
    isCommit: boolean,
    logger: LogType,
  ): Promise<void> {
    const tiffFolder = await makeTiffFolder(tmpFolder, tiffName);
    const targetPath = job.getJobPath(`${tiffName}.tiff`);
    fsa.configure(job.output.location);

    const outputExists = await fsa.exists(targetPath);
    logger.info({ targetPath, outputExists }, 'CogCreate:CheckExists');
    // Output file exists don't try and overwrite it
    if (outputExists) {
      logger.warn({ targetPath }, 'CogCreate:OutputExists');
      await this.checkJobStatus(job, logger);
      return;
    }

    let cutlineJson: FeatureCollection | undefined;
    if (job.output.cutline != null) {
      const cutlinePath = job.getJobPath('cutline.geojson.gz');
      logger.info({ path: cutlinePath }, 'CogCreate:UsingCutLine');
      cutlineJson = await Cutline.loadCutline(cutlinePath);
    } else {
      logger.warn('CutLine:Skip');
    }
    const cutline = new Cutline(job.tileMatrix, cutlineJson, job.output.cutline?.blend);

    const tmpVrtPath = await CogVrt.buildVrt(tiffFolder, job, cutline, tiffName, logger);

    if (tmpVrtPath == null) {
      logger.warn('CogCreate:NoMatchingSourceImagery');
      return;
    }

    const tmpTiff = fsa.join(tiffFolder, `${tiffName}.tiff`);

    await buildCogForName(job, tiffName, tmpVrtPath, tmpTiff, logger, isCommit);
    logger.info({ target: targetPath }, 'CogCreate:StoreTiff');
    if (isCommit) {
      await fsa.write(targetPath, createReadStream(tmpTiff));
      await this.checkJobStatus(job, logger);
    } else {
      logger.warn('DryRun:Done');
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

    const cfg = getDefaultConfig();
    if (expectedTiffs.size === 0) {
      // Insert Imagery and TileSet Config
      await insertConfigImagery(cfg, job, logger);
      await insertConfigTileSet(cfg, job, logger);

      // Update job status if this is the processing job.
      const url = await prepareUrl(job);
      const processingId = job.json.processingId;
      if (processingId != null) {
        const jobConfig = await cfg.ProcessingJob.get(processingId);

        if (jobConfig == null) throw new Error('Unable to find Job Processing Config:' + processingId);
        const jobComplete = jobConfig as ProcessingJobComplete;
        jobComplete.status = JobStatus.Complete;
        jobComplete.url = url;
        if (cfg.ProcessingJob.isWriteable()) await cfg.ProcessingJob.put(jobConfig);
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

    this.name = this.defineStringListParameter({
      argumentName: 'NAME',
      parameterLongName: '--name',
      description: 'list of cog names to process',
      required: false,
    });

    this.cogIndex = this.defineIntegerListParameter({
      argumentName: 'COG_INDEX',
      parameterLongName: '--cog-index',
      description: 'list of cog indexes to process',
      required: false,
    });

    this.commit = this.defineFlagParameter({
      parameterLongName: '--commit',
      description: 'Begin the transformation',
      required: false,
    });
  }
}
