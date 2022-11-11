import { LogConfig } from '@basemaps/shared';
import * as path from 'path';
import {
  CommandLineAction,
  CommandLineFlagParameter,
  CommandLineIntegerParameter,
  CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { GoogleTms, NamedBounds, Nztm2000QuadTms, QuadKey, TileMatrixSet } from '@basemaps/geo';
import { ChunkSource } from '@chunkd/core';
import { fsa } from '@chunkd/fs';
import { CogBuilder } from '../../cog/builder.js';
import { filterTiff, MaxConcurrencyDefault } from '../../cog/job.factory.js';
import { Cutline } from '../../cog/cutline.js';
import { CogTiff } from '@cogeotiff/core';
import { tile, JobTile } from './action.tile.generator.js';
import { createTar } from './action.create.tar.js';

const WorkerTaskSize = 500;
const DefaultMaxZoom = 15;

export class CommandCreateOverview extends CommandLineAction {
  private source: CommandLineStringParameter;
  private maxZoom: CommandLineIntegerParameter;
  private output: CommandLineStringParameter;
  private jobOutput: CommandLineStringParameter;
  private local: CommandLineFlagParameter;

  public constructor() {
    super({
      actionName: 'create-overview',
      summary: 'Create a overview of imagery',
      documentation: 'Given a s3 path of Basemaps imagery and create a overview of them within a maximum zoom level.',
    });
  }

  protected onDefineParameters(): void {
    this.source = this.defineStringParameter({
      argumentName: 'SOURCE',
      parameterLongName: '--source',
      description: 'Path of source imagery files',
      required: true,
    });
    this.maxZoom = this.defineIntegerParameter({
      argumentName: 'MAX_ZOOM',
      parameterLongName: '--max-zoom',
      description: 'Maximum zoom level for the overview',
    });
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterLongName: '--output',
      description: 'Path of output tar and index file',
      required: true,
    });
    this.jobOutput = this.defineStringParameter({
      argumentName: 'JOB_OUTPUT',
      parameterLongName: '--job-output',
      description: 'Job Tiles output for Tile generator action',
    });
    this.local = this.defineFlagParameter({
      parameterLongName: '--local',
      description: 'Process the create overview locally',
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const source = this.source.value;
    const output = this.output.value;
    if (source == null || output == null) throw new Error('Please provide path and output for create overview.');
    const maxZoom = this.maxZoom.value ?? DefaultMaxZoom;

    logger.info({ source, output }, 'CreateOverview: ListTiffs');
    const tiffList = (await fsa.toArray(fsa.list(source))).filter(filterTiff);
    const tiffSource = tiffList.map((path: string) => fsa.source(path));

    logger.info({ source, output }, 'CreateOverview: prepareSourceFiles');
    const tileMatrix = await this.getTileMatrix(tiffSource);

    logger.info({ source, output }, 'CreateOverview: PrepareCovering');
    const cutline = new Cutline(tileMatrix);
    const builder = new CogBuilder(tileMatrix, MaxConcurrencyDefault, logger);
    const metadata = await builder.build(tiffSource, cutline);

    logger.info({ source, output }, 'CreateOverview: prepareTiles');
    const tiles = await this.prepareTiles(metadata.files, maxZoom);
    if (tiles.size < 1) throw new Error('Failed to prepare overviews.');

    logger.info({ source, output }, 'CreateOverview: GenerateTiles');
    await this.generateTiles(output, tileMatrix, metadata.bounds, tiles);

    logger.info({ source, output }, 'CreateOverview: CreatingTarFile');
    if (this.local.value) await createTar(output, output, logger);

    logger.info({ source, output }, 'CreateOverview: Finished');
  }

  async prepareTiles(files: NamedBounds[], maxZoom: number): Promise<Set<string>> {
    const tiles = new Set<string>();
    for (const file of files) {
      const name = file.name;
      const [z, x, y] = path.basename(name).replace('.tiff', '').split('-').map(Number);
      let qk = QuadKey.fromTile({ x, y, z });
      this.addChildren(qk, maxZoom, tiles);
      while (qk.length > 0) {
        if (tiles.has(qk)) break;
        tiles.add(qk);
        qk = QuadKey.parent(qk);
      }
    }
    return tiles;
  }

  addChildren(qk: string, maxZoom: number, tiles: Set<string>): void {
    if (qk.length >= maxZoom) return;
    for (const child of QuadKey.children(qk)) {
      tiles.add(child);
      if (child.length < maxZoom) this.addChildren(child, maxZoom, tiles);
    }
  }

  async getTileMatrix(sources: ChunkSource[]): Promise<TileMatrixSet> {
    const tiff = await CogTiff.create(sources[0]);
    await tiff.getImage(0).loadGeoTiffTags();
    const projection = tiff.getImage(0).epsg;
    if (projection == null) throw new Error('Failed to find the projection from the imagery.');
    else if (projection === 2193) return Nztm2000QuadTms;
    else if (projection === 3857) return GoogleTms;
    else throw new Error(`Projection code: ${projection} not supported`);
  }

  async generateTiles(
    path: string,
    tileMatrix: TileMatrixSet,
    files: NamedBounds[],
    tiles: Set<string>,
  ): Promise<void> {
    const promises = [];
    const jobTiles: JobTile[] = [];
    let currentTiles = Array.from(tiles);
    while (currentTiles.length > 0) {
      const todo = currentTiles.slice(0, WorkerTaskSize);
      currentTiles = currentTiles.slice(WorkerTaskSize);
      const jobTile: JobTile = { path, tileMatrix: tileMatrix.identifier, tiles: todo };
      jobTiles.push(jobTile);
      if (this.local.value) promises.push(tile(jobTile, files));
    }

    const jobOutput = this.jobOutput.value;
    if (jobOutput) {
      fsa.write(fsa.join(jobOutput, 'jobTiles.json'), JSON.stringify(jobTiles));
      fsa.write(fsa.join(jobOutput, 'files.json'), JSON.stringify(files));
    }

    if (this.local.value) await Promise.all(promises);
  }
}
