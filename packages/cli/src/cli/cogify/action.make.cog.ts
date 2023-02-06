import { Epsg, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Env, FileConfig, fsa, LogConfig, LogType, titleizeImageryName } from '@basemaps/shared';
import {
  CommandLineAction,
  CommandLineFlagParameter,
  CommandLineIntegerParameter,
  CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { CogStacJob, JobCreationContext } from '../../cog/cog.stac.job.js';
import { ProjectionLoader } from '../../cog/projection.loader.js';
import * as ulid from 'ulid';
import { getCutline } from './cutline.js';
import { CogJobFactory } from '../../cog/job.factory.js';
import { basename } from 'path';
import { BatchJob } from './batch.job.js';
import { CredentialSourceJson } from '@chunkd/source-aws-v2';
import { ConfigLayer } from '@basemaps/config';
import { AlignedLevel } from '../../cog/constants.js';

interface OutputJobs {
  job: string;
  names: string[];
}

export class CommandMakeCog extends CommandLineAction {
  private imagery: CommandLineStringParameter;
  private tileMatrix: CommandLineStringParameter;
  private name: CommandLineStringParameter;
  private target: CommandLineStringParameter;
  private cutline: CommandLineStringParameter;
  private blend: CommandLineIntegerParameter;
  private alignedLevel: CommandLineIntegerParameter;
  private maxChunkUnit: CommandLineIntegerParameter;
  private output: CommandLineStringParameter;
  private aws: CommandLineFlagParameter;
  private disable: CommandLineFlagParameter;

  public constructor() {
    super({
      actionName: 'make-cog',
      summary: 'Import Basemaps imagery from s3 buckets',
      documentation: 'Given a valid path of raw imagery and import into basemaps',
    });
  }

  protected onDefineParameters(): void {
    this.imagery = this.defineStringParameter({
      argumentName: 'IMAGERY',
      parameterShortName: '-i',
      parameterLongName: '--imagery',
      description: 'Path of source imagery to import.',
      required: true,
    });
    this.target = this.defineStringParameter({
      argumentName: 'BUCKET',
      parameterShortName: '-t',
      parameterLongName: '--target',
      description: 'Target bucket for job.json',
      required: true,
    });
    this.name = this.defineStringParameter({
      argumentName: 'NAME',
      parameterShortName: '-n',
      parameterLongName: '--name',
      description: 'Custome imagery name',
      required: false,
    });
    this.tileMatrix = this.defineStringParameter({
      argumentName: 'TILE_MATRIX',
      parameterLongName: '--tile-matrix',
      description: 'Target tile matrix',
      required: false,
    });
    this.cutline = this.defineStringParameter({
      argumentName: 'CUTLINE',
      parameterLongName: '--cutline',
      description: 'Path of import cutline',
      required: false,
    });
    this.blend = this.defineIntegerParameter({
      argumentName: 'BLEND',
      parameterLongName: '--blend',
      description: 'Cutline blend',
      required: false,
    });
    this.alignedLevel = this.defineIntegerParameter({
      argumentName: 'ALIGNED_LEVEL',
      parameterLongName: '--aligned-level',
      description: 'Aligned level between resolution and cog',
      required: false,
    });
    this.maxChunkUnit = this.defineIntegerParameter({
      argumentName: 'MAX_CHUNK_UNIT',
      parameterLongName: '--max-chunk-unit',
      description: 'Number of small jobs are chunked into one job',
      required: false,
    });
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterShortName: '-o',
      parameterLongName: '--output',
      description: 'Output job.json path',
      required: false,
    });
    this.aws = this.defineFlagParameter({
      parameterLongName: '--aws',
      description: 'Running the job on aws',
      required: false,
    });
    this.disable = this.defineFlagParameter({
      parameterLongName: '--disable',
      description: 'Add disable flag for the new inserted layer.',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const imagery = this.imagery.value;
    let name = this.name.value === '' ? undefined : this.name.value;
    if (imagery == null) throw new Error('Please provide a valid imagery source');
    await Promise.all([3791, 3790, 3789, 3788].map((code) => ProjectionLoader.load(code)));

    const source = imagery.endsWith('/') ? imagery : imagery + '/';
    logger.info({ imagery: source }, 'FindImagery');
    if (name == null) name = source.split('/').filter(Boolean).pop();
    if (name == null) throw new Error('Failed to find imagery set name');

    let tileMatrixSets: string[] = [];
    const tileMatrix = this.tileMatrix.value;
    if (tileMatrix == null) throw new Error('Please provide valid tile set matrix.');
    if (tileMatrix.includes('/')) tileMatrixSets = tileMatrixSets.concat(tileMatrix.split('/'));
    else tileMatrixSets.push(tileMatrix);

    const outputJobs: OutputJobs[] = [];
    const configLayer: ConfigLayer = { name, title: titleizeImageryName(name) };
    const paths: string[] = [];
    for (const identifier of tileMatrixSets) {
      const id = ulid.ulid();
      const tileMatrix = TileMatrixSets.find(identifier);
      if (tileMatrix == null) throw new Error(`Cannot find tile matrix: ${identifier}`);
      logger.info({ id, tileMatrix: tileMatrix.identifier }, 'SetTileMatrix');
      const job = await this.makeCog(id, name, tileMatrix, source);
      const jobLocation = job.getJobPath('job.json');
      // Split the jobs into chunked tasks
      const chunkedJobs = await this.splitJob(job, logger);
      for (const names of chunkedJobs) {
        outputJobs.push({ job: jobLocation, names });
      }

      // Set config layer for output
      const path = jobLocation.replace('/job.json', '');
      configLayer[tileMatrix.projection.code] = path;
      if (this.disable.value) configLayer.disable = true;
      paths.push(path);
    }

    const output = this.output.value;
    if (output) {
      fsa.write(fsa.join(output, 'jobs.json'), JSON.stringify(outputJobs));
      fsa.write(fsa.join(output, 'layer.json'), JSON.stringify(configLayer));
      fsa.write(fsa.join(output, 'paths.json'), JSON.stringify(paths));
    }
  }

  async makeCog(id: string, imageryName: string, tileMatrix: TileMatrixSet, uri: string): Promise<CogStacJob> {
    const bucket = this.target.value;
    if (bucket == null && this.aws.value) throw new Error('Please provide a validate bucket for output job.json');
    let resampling;
    /** Process Gebco 2193 as one cog of full extent to avoid antimeridian problems */
    if (tileMatrix.projection === Epsg.Nztm2000 && imageryName.includes('gebco')) {
      resampling = {
        warp: 'nearest', // GDAL doesn't like other warp settings when crossing antimeridian
        overview: 'lanczos',
      } as const;
    }

    if (imageryName.includes('geographx')) {
      resampling = {
        warp: 'bilinear',
        overview: 'bilinear',
      } as const;
    }

    // Prepare the cutline
    let cutline: { href: string; blend: number } | undefined;
    const cutlinePath = this.cutline.value === '' ? undefined : this.cutline.value;
    const blend = this.blend.value === 0 ? undefined : this.blend.value;
    if (cutlinePath && blend) cutline = { href: cutlinePath, blend };
    else if (cutlinePath) new Error('Please provide a blend for the cutline');
    else cutline = getCutline(imageryName);
    if (cutline == null) throw new Error(`Cannot found default cutline from imagery name: ${imageryName}`);

    const alignedLevel = this.alignedLevel.value ?? AlignedLevel;

    const ctx: JobCreationContext = {
      imageryName,
      override: {
        id,
        projection: Epsg.Nztm2000,
        resampling,
        alignedLevel,
      },
      outputLocation: this.aws.value
        ? await this.findLocation(`s3://${bucket}/`)
        : { type: 'local' as const, path: '.' },
      sourceLocation: await this.findLocation(uri),
      cutline,
      batch: false, // Only create the job.json in the make cog cli
      tileMatrix,
      oneCogCovering: false,
    };

    const job = (await CogJobFactory.create(ctx)) as CogStacJob;
    return job;
  }

  async splitJob(job: CogStacJob, logger: LogType): Promise<string[][]> {
    // Get all the existing output tiffs
    const existTiffs: Set<string> = new Set();
    for await (const fileName of fsa.list(job.getJobPath())) {
      if (fileName.endsWith('.tiff')) existTiffs.add(basename(fileName));
    }

    // Prepare chunk job and individual jobs based on imagery size.
    const jobs = await BatchJob.getJobs(job, existTiffs, logger, this.maxChunkUnit.value);
    if (jobs.length === 0) {
      logger.info('NoJobs');
      return [];
    }
    logger.info({ jobTotal: job.output.files.length, jobLeft: jobs.length }, 'SplitJob:ChunkedJobs');
    return jobs;
  }

  async findLocation(path: string): Promise<FileConfig> {
    if (path.startsWith('s3://')) {
      const configPath = Env.get(Env.AwsRoleConfigPath);
      if (configPath == null) throw new Error('No aws config path provided');
      const configs = await fsa.readJson<CredentialSourceJson>(configPath);
      for (const prefix of configs.prefixes) {
        if (path.startsWith(prefix.prefix)) return { type: 's3', path, roleArn: prefix.roleArn };
      }
    } else {
      return { type: 'local', path: path };
    }

    throw new Error(`No valid role to find the path: ${path}`);
  }
}
