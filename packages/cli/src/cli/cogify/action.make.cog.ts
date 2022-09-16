import { Epsg, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { CogStacJob, JobCreationContext } from '../../cog/cog.stac.job.js';
import { ProjectionLoader } from '../../cog/projection.loader.js';
import * as ulid from 'ulid';
import { getCutline } from './cutline.js';
import { CogJobFactory } from '../../cog/job.factory.js';

export class CommandMakeCog extends CommandLineAction {
  private imagery: CommandLineStringParameter;
  private tileMatrix: CommandLineStringParameter;
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
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterShortName: '-o',
      parameterLongName: '--output',
      description: 'Output job.json path',
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

    const outputs: string[] = [];
    for (const identifier of tileMatrixSets) {
      const id = ulid.ulid();
      const tileMatrix = TileMatrixSets.find(identifier);
      if (tileMatrix == null) throw new Error(`Cannot find tile matrix: ${identifier}`);
      logger.info({ id, tileMatrix: tileMatrix.identifier }, 'SetTileMatrix');
      const job = await this.makeCog(id, name, tileMatrix, source);
      outputs.push(job.getJobPath('job.json'));
    }

    // Write the output job json
    const output = this.output.value;
    if (output) {
      fsa.write(output, JSON.stringify(outputs));
    }
  }

  async makeCog(id: string, imageryName: string, tileMatrix: TileMatrixSet, uri: string): Promise<CogStacJob> {
    const bucket = this.target.value;
    if (bucket == null) throw new Error('Please provide a validate bucket for output job.json');
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

    const ctx: JobCreationContext = {
      imageryName,
      override: { id, projection: Epsg.Nztm2000, resampling },
      outputLocation: { type: 's3' as const, path: `s3://${bucket}` },
      sourceLocation: { type: 's3', path: uri },
      cutline,
      batch: false, // Only create the job.json in the make cog cli
      tileMatrix,
      oneCogCovering: false,
    };
    const job = (await CogJobFactory.create(ctx)) as CogStacJob;
    return job;
  }
}
