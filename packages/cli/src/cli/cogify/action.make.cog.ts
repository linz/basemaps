import { Epsg, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogConfig, LogType } from '@basemaps/shared';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { CogStacJob, JobCreationContext } from '../../cog/cog.stac.job.js';
import { ProjectionLoader } from '../../cog/projection.loader.js';
import * as ulid from 'ulid';
import { getCutline } from './cutline.js';
import { CogJobFactory } from '../../cog/job.factory.js';

function guessProjection(imageryName: string): Epsg | undefined {
  if (imageryName.startsWith('chatham')) return Epsg.Citm2000;
  if (imageryName.includes('rural')) return Epsg.Nztm2000;
  if (imageryName.includes('urban')) return Epsg.Nztm2000;
  return undefined;
}

export class CommandMakeCog extends CommandLineAction {
  private imagery: CommandLineStringParameter;
  private name: CommandLineStringParameter;
  private target: CommandLineStringParameter;
  private cutline: CommandLineStringParameter;
  private blend: CommandLineIntegerParameter;
  private output: CommandLineStringParameter;

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
    this.name = this.defineStringParameter({
      argumentName: 'NAME',
      parameterShortName: '-n',
      parameterLongName: '--name',
      description: 'Custome imagery name',
      required: false,
    });
    this.target = this.defineStringParameter({
      argumentName: 'TARGET',
      parameterShortName: '-t',
      parameterLongName: '--target',
      description: 'Target tile matrix',
      required: false,
    });
    this.cutline = this.defineStringParameter({
      argumentName: 'CUTLINE',
      parameterShortName: '-c',
      parameterLongName: '--cutline',
      description: 'Path of import cutline',
      required: false,
    });
    this.blend = this.defineIntegerParameter({
      argumentName: 'BLEND',
      parameterShortName: '-b',
      parameterLongName: '--blend',
      description: 'Cutline blend',
      required: false,
    });
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterShortName: '-o',
      parameterLongName: '--output',
      description: 'Output the job.json paths',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const imagery = this.imagery.value;
    const name = this.name.value;
    if (imagery == null) throw new Error('Please provide a valid imagery source');
    await Promise.all([3791, 3790, 3789, 3788].map((code) => ProjectionLoader.load(code)));

    const source = imagery.endsWith('/') ? imagery : imagery + '/';
    logger.info({ imagery: source }, 'FindImagery');
    const imagerySetName = source.split('/').filter(Boolean).pop();

    if (imagerySetName == null) throw new Error('Failed to find imagery set name');
    const uri = await this.findImagery(source, logger);
    const target = this.target.value;
    const targets: string[] = target ? [target] : ['NZTM2000Quad', 'WebMercatorQuad'];

    const outputs: string[] = [];
    for (const target of targets) {
      const id = ulid.ulid();
      const tileMatrix = TileMatrixSets.find(target);
      if (tileMatrix == null) throw new Error(`Cannot find tile matrix: ${target}`);
      logger.info({ id, tileMatrix: tileMatrix.identifier }, 'SetTileMatrix');
      const job = await this.makeCog(id, name ? name : imagerySetName, tileMatrix, uri);
      outputs.push(job.getJobPath('job.json'));
      // Write the output job json
      const output = this.output.value;
      if (output) {
        fsa.write(output, JSON.stringify(outputs));
      }
    }
  }

  async makeCog(id: string, imageryName: string, tileMatrix: TileMatrixSet, uri: string): Promise<CogStacJob> {
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
    if (this.cutline.value && this.blend.value) cutline = { href: this.cutline.value, blend: this.blend.value };
    else if (this.cutline.value) new Error('Please provide a blend for the cutline');
    else cutline = getCutline(imageryName);
    if (cutline == null) throw new Error(`Cannot found default cutline from imagery name: ${imageryName}`);

    const ctx: JobCreationContext = {
      imageryName,
      override: { id, projection: guessProjection(imageryName), resampling },
      outputLocation: { type: 's3' as const, path: 's3://linz-basemaps' },
      sourceLocation: { type: 's3', path: uri },
      cutline,
      batch: false, // Only create the job.json in the make cog cli
      tileMatrix,
      oneCogCovering: false,
    };
    const job = (await CogJobFactory.create(ctx)) as CogStacJob;
    return job;
  }

  async findImagery(imagery: string, logger: LogType): Promise<string> {
    const keys = fsa.list(imagery);
    for await (const key of keys) {
      if (key != null && (key.endsWith('.tiff') || key.endsWith('.tif'))) {
        logger.info({ imagery }, 'FoundFiles');
        return imagery;
      }
    }
    throw new Error('Unable to find imagery: ' + imagery);
  }
}
