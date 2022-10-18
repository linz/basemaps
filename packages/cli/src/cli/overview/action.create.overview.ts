import { LogConfig, LogType } from '@basemaps/shared';
import * as path from 'path';
import { promises as fs } from 'fs';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import {
  Bounds,
  NamedBounds,
  Nztm2000QuadTms,
  Nztm2000Tms,
  QuadKey,
  TileMatrixSet,
  TileMatrixSets,
} from '@basemaps/geo';
import os from 'os';
import { WorkerRpcPool } from '@wtrpc/core';
import { JobTiles, RpcContract } from './tile.generator.js';
import { CotarIndexBinary, CotarIndexBuilder, CotarIndexOptions, TarReader } from '@cotar/core';
import { SourceMemory, ChunkSource } from '@chunkd/core';
import { fsa } from '@chunkd/fs';
import { CogBuilder } from '../../cog/builder.js';
import { filterTiff, MaxConcurrencyDefault } from '../../cog/job.factory.js';
import { Cutline } from '../../cog/cutline.js';
import { CogTiff } from '@cogeotiff/core';
import { createHash } from 'crypto';
import { TarBuilder } from '@cotar/tar';

// Create tiles per worker invocation
const WorkerTaskSize = 500;
const workerUrl = new URL('./tile.generator.js', import.meta.url);
const threadCount = os.cpus().length / 8;
const pool = new WorkerRpcPool<RpcContract>(threadCount, workerUrl);

const DefaultMaxZoom = 15;

export class CommandCreateOverview extends CommandLineAction {
  private source: CommandLineStringParameter;
  private maxZoom: CommandLineIntegerParameter;
  private output: CommandLineStringParameter;

  tiles = new Set<string>();

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
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const source = this.source.value;
    if (source == null) throw new Error('Please provide a path for the source imagery.');
    const maxZoom = this.maxZoom.value ?? DefaultMaxZoom;
    const hash = createHash('sha256').update(source).digest('hex');
    const path = fsa.join('overview', hash);

    logger.info({ source, path }, 'CreateOverview: ListTiffs');
    const tiffList = (await fsa.toArray(fsa.list(source))).filter(filterTiff);
    const tiffSource = tiffList.map((path: string) => fsa.source(path));

    logger.info({ source, path }, 'CreateOverview: prepareSourceFiles');
    const sourceFiles = await this.prepareSourceFiles(tiffSource);

    logger.info({ source, path }, 'CreateOverview: PrepareCovering');
    const cutline = new Cutline(sourceFiles.tileMatrix);
    const builder = new CogBuilder(sourceFiles.tileMatrix, MaxConcurrencyDefault, logger);
    const metadata = await builder.build(tiffSource, cutline);

    logger.info({ source, path }, 'CreateOverview: prepareTiles');
    this.prepareTiles(metadata.files, maxZoom);
    if (this.tiles.size < 1) throw new Error('Failed to prepare overviews.');

    logger.info({ source, path }, 'CreateOverview: GenerateTiles');
    await this.generateTiles(path, sourceFiles.tileMatrix, sourceFiles.files);

    logger.info({ source, path }, 'CreateOverview: CreatingTarFile');
    await this.createTar(path, logger);

    logger.info({ source, path }, 'CreateOverview: Finished');
    return;
  }

  async prepareTiles(files: NamedBounds[], maxZoom: number): Promise<void> {
    for (const file of files) {
      const name = file.name;
      const [z, x, y] = path.basename(name).replace('.tiff', '').split('-').map(Number);
      let qk = QuadKey.fromTile({ x, y, z });
      this.addChildren(qk, maxZoom);
      while (qk.length > 0) {
        if (this.tiles.has(qk)) break;
        this.tiles.add(qk);
        qk = QuadKey.parent(qk);
      }
    }
  }

  addChildren(qk: string, maxZoom: number): void {
    if (qk.length >= maxZoom) return;
    for (const child of QuadKey.children(qk)) {
      this.tiles.add(child);
      if (child.length < maxZoom) this.addChildren(child, maxZoom);
    }
  }

  async prepareSourceFiles(sources: ChunkSource[]): Promise<{ tileMatrix: TileMatrixSet; files: NamedBounds[] }> {
    let tileMatrix;
    const files: NamedBounds[] = [];
    for (const source of sources) {
      const tiff = await CogTiff.create(source);
      await tiff.getImage(0).loadGeoTiffTags();
      if (tileMatrix == null) tileMatrix = TileMatrixSets.tryGet(tiff.getImage(0).epsg);
      const imgBounds = Bounds.fromBbox(tiff.getImage(0).bbox);
      files.push({
        name: tiff.source.uri,
        ...imgBounds,
      });
    }
    if (tileMatrix == null) throw new Error('Unable to find the imagery tileMatrix');
    if (tileMatrix.identifier === Nztm2000Tms.identifier) tileMatrix = Nztm2000QuadTms;
    return { tileMatrix, files };
  }

  async generateTiles(path: string, tileMatrix: TileMatrixSet, files: NamedBounds[]): Promise<void> {
    const promises = [];
    let currentTiles = Array.from(this.tiles);
    while (currentTiles.length > 0) {
      const todo = currentTiles.slice(0, WorkerTaskSize);
      currentTiles = currentTiles.slice(WorkerTaskSize);
      const jobTiles: JobTiles = { path, files, tileMatrix: tileMatrix.identifier, tiles: todo };
      promises.push(pool.run('tile', jobTiles));
    }

    await Promise.all(promises);
    await pool.close();
  }

  async createTar(path: string, logger: LogType): Promise<void> {
    const tarFile = 'overview.tar.co';
    const tarIndex = 'overview.tar.index';
    const tarFilePath = fsa.join(path, tarFile);
    const tarIndexPath = fsa.join(path, tarIndex);

    // Create tar file
    const tiles = await fsa.toArray(fsa.list(`${path}/tiles/`));
    const tarBuilder = new TarBuilder(tarFilePath);
    tiles.sort((a, b) => a.localeCompare(b));
    for (const file of tiles) await tarBuilder.write(file.slice(file.indexOf('tiles/')), await fsa.read(file));

    // Creating tar index
    const fd = await fs.open(tarFilePath, 'r');
    const opts: CotarIndexOptions = { packingFactor: 1.25, maxSearch: 50 }; // Default package rule.
    const index = await CotarIndexBuilder.create(fd, opts);
    const indexBinary = await CotarIndexBinary.create(new SourceMemory('index', index.buffer));
    await TarReader.validate(fd, indexBinary);
    await fs.writeFile(tarIndexPath, index.buffer);

    // Copy the output into s3 location
    const output = this.output.value;
    if (output) {
      logger.info({ output }, 'CreateOverview: UploadOutput');
      await fsa.write(fsa.join(output, tarFile), await fsa.read(tarFilePath));
    }
  }
}
