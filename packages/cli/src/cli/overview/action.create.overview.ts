import { LogConfig } from '@basemaps/shared';
import * as path from 'path';
import { promises as fs } from 'fs';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { Bounds, NamedBounds, QuadKey, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import os from 'os';
import tar from 'tar';
import { WorkerRpcPool } from '@wtrpc/core';
import { JobTiles } from './tile.generator.js';
import { CogTiff } from '@cogeotiff/core';
import * as cover from '@mapbox/tile-cover';
import { Polygon } from 'geojson';
import { CotarIndexBinary, CotarIndexBuilder, CotarIndexOptions, TarReader } from '@cotar/core';
import { SourceMemory } from '@chunkd/core';
import pLimit from 'p-limit';
import { fsa } from '@chunkd/fs';

const Q = pLimit(1);

// Create tiles per worker invocation
const WorkerTaskSize = 500;
const workerUrl = new URL('./tile.generator.js', import.meta.url);
const threadCount = os.cpus().length / 8;
const pool = new WorkerRpcPool(threadCount, workerUrl);

const DefaultMaxZoom = 15;
const DefaultOuput = './output/';

export class CommandCreateOverview extends CommandLineAction {
  private source: CommandLineStringParameter;
  private maxZoom: CommandLineIntegerParameter;
  private output: CommandLineStringParameter;

  tiles = new Set<string>();
  files: NamedBounds[] = [];
  tileMatrix: TileMatrixSet | null;

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
      parameterLongName: '--output',
      description: 'Path of output tar and index file',
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const source = this.source.value;
    const maxZoom = this.maxZoom.value ?? DefaultMaxZoom;
    if (source == null) throw new Error('Please provide a path for the source imagery.');

    logger.info({ source }, 'CreateOverview: ListTiffs');
    const sourceFiles = await fsa.toArray(fsa.list(source));
    let count = 0;
    const todo = sourceFiles.map((f) => {
      return Q(async () => {
        if (f.toLocaleLowerCase().endsWith('.tif') || f.toLocaleLowerCase().endsWith('.tiff')) {
          const tiff = await CogTiff.create(fsa.source(f));
          logger.info({ total: sourceFiles.length, count }, 'CreateOverview:PrepareOverview');
          await this.createOverview(tiff, maxZoom);
        }
        count++;
      });
    });
    await Promise.all(todo);
    if (this.tiles.size < 1) throw new Error('Failed to prepare overviews.');

    logger.info({ source }, 'CreateOverview: GenerateTiles');
    await this.generateTiles();

    logger.info({ source }, 'CreateOverview: GenerateTiles');
    const output = this.output.value ?? DefaultOuput;
    await this.createTar(output);
    return;
  }

  async createOverview(tiff: CogTiff, maxZoom: number): Promise<void> {
    let bounds;
    await tiff.getImage(0).loadGeoTiffTags();
    if (this.tileMatrix == null) this.tileMatrix = TileMatrixSets.tryGet(tiff.getImage(0).epsg);
    const imgBounds = Bounds.fromBbox(tiff.getImage(0).bbox);
    if (bounds == null) bounds = imgBounds;
    bounds = bounds.union(imgBounds);
    this.files.push({
      name: tiff.source.uri,
      ...imgBounds,
    });

    await this.prepareTiles(tiff, maxZoom);
  }

  async prepareTiles(tiff: CogTiff, maxZoom: number): Promise<void> {
    const bbox = tiff.getImage(0).bbox;
    const geom: Polygon = { type: 'Polygon', coordinates: Bounds.fromBbox(bbox).toPolygon() };
    const lastTime = performance.now();
    console.log('start');
    const tiles = cover.tiles(geom, { min_zoom: maxZoom, max_zoom: maxZoom }); // TODO: What is min zoom here? and this takes forever to run?
    const duration = performance.now() - lastTime;
    console.log('finish', duration);
    for (const tile of tiles) {
      let qk = QuadKey.fromTile({ x: tile[0], y: tile[1], z: tile[2] });
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

  async generateTiles(): Promise<void> {
    if (this.tileMatrix == null) throw new Error('Unable to find the imagery tileMatrix');
    const promises = [];
    let currentTiles = Array.from(this.tiles);
    while (currentTiles.length > 0) {
      const todo = currentTiles.slice(0, WorkerTaskSize);
      currentTiles = currentTiles.slice(WorkerTaskSize);
      const jobTiles: JobTiles = { files: this.files, tileMatrix: this.tileMatrix, tiles: todo };
      promises.push(pool.run('tile', jobTiles));
    }

    await Promise.all(promises);
    await pool.close();
  }

  async createTar(output: string): Promise<void> {
    const tarFile = fsa.join(output, 'overview.co.tar');
    const tarIndex = fsa.join(output, 'overview.tar.index');

    tar.c({ file: tarFile }, ['./tiles/']).then(() => {
      `${tarFile} file created`;
    });

    const fd = await fs.open(tarFile, 'r');
    const opts: CotarIndexOptions = { packingFactor: 1.25, maxSearch: 50 }; // Default package rule.
    const index = await CotarIndexBuilder.create(fd, opts);
    const indexBinary = await CotarIndexBinary.create(new SourceMemory('index', index.buffer));
    await TarReader.validate(fd, indexBinary);
    await fs.writeFile(tarIndex, index.buffer);
  }
}
