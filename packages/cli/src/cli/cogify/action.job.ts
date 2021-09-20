import { Epsg, GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { FileConfig, FileConfigPath, fsa } from '@basemaps/shared';
import {
  CommandLineAction,
  CommandLineFlagParameter,
  CommandLineIntegerParameter,
  CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { JobCreationContext } from '../../cog/cog.stac.job.js';
import { CogJobFactory, MaxConcurrencyDefault } from '../../cog/job.factory.js';
import { GdalCogBuilderDefaults, GdalCogBuilderResampling, GdalResamplingOptions } from '../../gdal/gdal.config.js';
import { CliId } from '../base.cli.js';

export class CLiInputData {
  path: CommandLineStringParameter;
  roleArn: CommandLineStringParameter;
  externalId: CommandLineStringParameter;

  constructor(parent: CommandLineAction, prefix: string) {
    this.path = parent.defineStringParameter({
      argumentName: prefix.toUpperCase(),
      parameterLongName: `--${prefix}`,
      description: 'Folder or S3 Bucket location to use',
      required: true,
    });

    this.roleArn = parent.defineStringParameter({
      argumentName: prefix.toUpperCase() + '_ARN',
      parameterLongName: `--${prefix}-role-arn`,
      description: 'Role to be assumed to access the data',
      required: false,
    });

    this.externalId = parent.defineStringParameter({
      argumentName: prefix.toUpperCase() + '_EXTERNAL_ID',
      parameterLongName: `--${prefix}-role-external-id`,
      description: 'Role external id to be assumed to access the data',
      required: false,
    });
  }
}

export class ActionJobCreate extends CommandLineAction {
  private source: CLiInputData;
  private output: CLiInputData;
  private maxConcurrency: CommandLineIntegerParameter;
  private cutline: CommandLineStringParameter;
  private cutlineBlend: CommandLineIntegerParameter;
  private overrideId: CommandLineStringParameter;
  private overrideWarpReample: CommandLineStringParameter;
  private submitBatch: CommandLineFlagParameter;
  private quality: CommandLineIntegerParameter;
  private sourceProjection: CommandLineIntegerParameter;
  private tileMatrix: CommandLineStringParameter;
  private oneCog: CommandLineFlagParameter;
  private fileList: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'job',
      summary: 'create a list of cogs that need to be processed',
      documentation: 'List a folder/bucket full of cogs and determine a optimal processing pipeline',
    });
  }

  fsConfig(source: CLiInputData): FileConfig {
    if (source.path.value == null) {
      throw new Error('Invalid path');
    }
    if (!source.path.value.startsWith('s3://')) {
      return { type: 'local', path: source.path.value };
    }
    if (source.roleArn.value == null) {
      return { type: 's3', path: source.path.value };
    }
    return {
      path: source.path.value,
      type: 's3',
      roleArn: source.roleArn.value,
      externalId: source.externalId.value,
    };
  }

  async onExecute(): Promise<void> {
    const sourceLocation: FileConfig | FileConfigPath = this.fsConfig(this.source);
    const outputLocation = this.fsConfig(this.output);

    fsa.configure(this.fsConfig(this.source));
    fsa.configure(this.fsConfig(this.output));

    let cutline = undefined;
    if (this.cutline?.value) {
      cutline = { href: this.cutline.value, blend: this.cutlineBlend.value ?? 20 };
    }

    const tileMatrix = TileMatrixSets.find(this.tileMatrix.value ?? GoogleTms.identifier);
    if (tileMatrix == null) throw new Error('Invalid target-projection');

    let resampling: GdalCogBuilderResampling | undefined;

    if (this.overrideWarpReample?.value != null) {
      const warp = GdalResamplingOptions[this.overrideWarpReample?.value];
      if (warp == null) {
        throw new Error('Invalid override-warp-resampling');
      }
      resampling = {
        warp,
        overview: 'lanczos',
      };
    }

    const fileListPath = this.fileList?.value;
    if (fileListPath != null) {
      const fileData = await fsa.read(fileListPath);
      (sourceLocation as FileConfigPath).files = fileData
        .toString()
        .trim()
        .split('\n')
        .map((fn) => sourceLocation.path + '/' + fn);
    }

    const ctx: JobCreationContext = {
      sourceLocation,
      outputLocation,
      cutline,
      tileMatrix,
      override: {
        concurrency: this.maxConcurrency?.value ?? MaxConcurrencyDefault,
        quality: this.quality?.value ?? GdalCogBuilderDefaults.quality,
        id: this.overrideId?.value ?? CliId,
        projection: Epsg.tryGet(this.sourceProjection?.value),
        resampling,
      },
      batch: this.submitBatch?.value ?? false,
      oneCogCovering: this.oneCog?.value ?? false,
    };

    await CogJobFactory.create(ctx);
  }

  protected onDefineParameters(): void {
    this.source = new CLiInputData(this, 'source');
    this.output = new CLiInputData(this, 'output');

    this.maxConcurrency = this.defineIntegerParameter({
      argumentName: 'MAX_CONCURRENCY',
      parameterLongName: '--concurrency',
      parameterShortName: '-c',
      description: 'Maximum number of requests to use at one time',
      defaultValue: MaxConcurrencyDefault,
      required: false,
    });

    this.cutline = this.defineStringParameter({
      argumentName: 'CUTLINE',
      parameterLongName: '--cutline',
      description: 'use a shapefile to crop the COGs',
      required: false,
    });

    this.cutlineBlend = this.defineIntegerParameter({
      argumentName: 'CUTLINE_BLEND',
      parameterLongName: '--cblend',
      description: 'Set a blend distance to use to blend over cutlines (in pixels)',
      required: false,
    });

    this.overrideId = this.defineStringParameter({
      argumentName: 'OVERRIDE_ID',
      parameterLongName: '--override-id',
      description: 'create job with a pre determined job id',
      required: false,
    });

    this.overrideWarpReample = this.defineStringParameter({
      argumentName: 'METHOD',
      parameterLongName: '--override-warp-resampling',
      description: 'Defaults to bilinear. Common options are: nearest, lanczos, cubic',
      required: false,
    });

    this.submitBatch = this.defineFlagParameter({
      parameterLongName: `--batch`,
      description: 'Submit the job to AWS Batch',
      required: false,
    });

    this.quality = this.defineIntegerParameter({
      argumentName: 'QUALITY',
      parameterLongName: '--quality',
      description: 'Compression quality (0-100)',
      required: false,
    });

    this.sourceProjection = this.defineIntegerParameter({
      argumentName: 'SOURCE_PROJECTION',
      parameterLongName: '--source-projection',
      description: 'The EPSG code of the source imagery',
      required: false,
    });

    this.tileMatrix = this.defineStringParameter({
      argumentName: 'TILE_MATRIX',
      parameterLongName: '--target-tile-matrix-set',
      description: 'The TileMatrixSet to generate the COGS for',
      defaultValue: GoogleTms.identifier,
      required: false,
    });

    this.oneCog = this.defineFlagParameter({
      parameterLongName: '--one-cog',
      description: 'ignore target projection window and just produce one big COG.',
      required: false,
    });

    this.fileList = this.defineStringParameter({
      argumentName: 'FILE_LIST',
      parameterLongName: '--filelist',
      description: 'supply a list of files to use as source imagery',
      required: false,
    });
  }
}
