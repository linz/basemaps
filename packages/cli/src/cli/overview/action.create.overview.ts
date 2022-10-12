import { fsa, LogConfig, LogType } from '@basemaps/shared';
import * as path from 'path';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { QuadKey, TileMatrixSets } from '@basemaps/geo';
import * as ulid from 'ulid';
import os from 'os';
import { WorkerRpcPool } from '@wtrpc/core';
import { JobTiles } from './tile.generator.js';

// Create tiles per worker invocation
const WorkerTaskSize = 500;
const workerUrl = new URL('./tile.generator.js', import.meta.url);
const threadCount = os.cpus().length / 8;
const pool = new WorkerRpcPool(threadCount, workerUrl);

const DefaultMaxZoom = 15;

export class CommandCreateOverview extends CommandLineAction {
  private source: CommandLineStringParameter;
  private maxZoom: CommandLineIntegerParameter;
  private output: CommandLineStringParameter;

  private tiles = new Set<string>();

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
      description: 'Output of the bundle file',
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
    const source = this.source.value;
    const maxZoom = this.maxZoom.value ?? DefaultMaxZoom;
    if (source == null) throw new Error('Please provide a path for the source imagery.');
    const { id, tileMatrix } = this.parseSource(source, logger);

    logger.info({ source }, 'CreateOverview: PrepareTiles');
    await this.prepareTiles(source, maxZoom);
    if (this.tiles.size < 1) throw new Error('Failed to prepare tiles.');

    logger.info({ source }, 'CreateOverview: GenerateTiles');
    const promises = [];
    let currentTiles = Array.from(this.tiles);
    while (currentTiles.length > 0) {
      const todo = currentTiles.slice(0, WorkerTaskSize);
      currentTiles = currentTiles.slice(WorkerTaskSize);
      const jobTiles: JobTiles = { id, tileMatrix, tiles: todo };
      promises.push(pool.run('tile', jobTiles));
    }

    await Promise.all(promises);
    await pool.close();
    return;
  }

  async prepareTiles(source: string, maxZoom: number): Promise<void> {
    for await (const file of fsa.list(source)) {
      if (!file.endsWith('tiff')) continue;
      const filename = path.basename(file).replace('.tiff', '');
      const [z, x, y] = filename.split('-').map(Number);
      let qk = QuadKey.fromTile({ z, x, y });

      this.addChildren(qk, maxZoom);
      while (qk.length > 0) {
        if (this.tiles.has(qk)) break;
        this.tiles.add(qk);
        qk = QuadKey.parent(qk);
      }
    }
  }

  addChildren(qk: string, maxZoom: number): void {
    for (const child of QuadKey.children(qk)) {
      this.tiles.add(child);
      if (child.length < maxZoom) this.addChildren(child, maxZoom);
    }
  }

  parseSource(source: string, logger: LogType): { id: string; tileMatrix: string } {
    const [bucket, espg, name, id] = source.replace('s3://', '').split('/');
    const tileMatrix = TileMatrixSets.find(espg);
    if (tileMatrix == null || !ulid.decodeTime(id)) throw new Error('Please provide a valid Basemaps imagery Path');
    logger.info({ id, name, bucket, tileMatrix: tileMatrix.identifier }, 'CreateOverview:ParseSourcePath');
    return { id, tileMatrix: tileMatrix.identifier };
  }
}
