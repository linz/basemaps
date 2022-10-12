import { fsa, LogConfig } from '@basemaps/shared';
import * as path from 'path';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { Bounds, NamedBounds, QuadKey, TileMatrixSets } from '@basemaps/geo';
import os from 'os';
import { WorkerRpcPool } from '@wtrpc/core';
import { JobTiles } from './tile.generator.js';
import { CogTiff } from '@cogeotiff/core';
import * as cover from '@mapbox/tile-cover';
import { Polygon } from 'geojson';

// Create tiles per worker invocation
const WorkerTaskSize = 500;
const workerUrl = new URL('./tile.generator.js', import.meta.url);
const threadCount = os.cpus().length / 8;
const pool = new WorkerRpcPool(threadCount, workerUrl);

const DefaultMaxZoom = 15;

export class CommandCreateOverview extends CommandLineAction {
  private source: CommandLineStringParameter;
  private maxZoom: CommandLineIntegerParameter;

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
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const source = this.source.value;
    const maxZoom = this.maxZoom.value ?? DefaultMaxZoom;
    if (source == null) throw new Error('Please provide a path for the source imagery.');

    logger.info({ source }, 'CreateOverview: ListTiffs');
    const sourceFiles = await fsa.toArray(fsa.list(source));
    const tiffs = await Promise.all(
      sourceFiles
        .filter((f) => f.toLocaleLowerCase().endsWith('.tif') || f.toLocaleLowerCase().endsWith('.tiff'))
        .map((c) => CogTiff.create(fsa.source(c))),
    );
    if (tiffs.length === 0) throw new Error('Provided path does not have tif and tiff imagery.');

    logger.info({ path }, 'CreateOverview:PrepareFiles');
    let tileMatrix;
    let bounds;
    const files: NamedBounds[] = [];
    for (const tif of tiffs) {
      await tif.getImage(0).loadGeoTiffTags();
      if (tileMatrix == null) tileMatrix = TileMatrixSets.tryGet(tif.getImage(0).epsg);
      const imgBounds = Bounds.fromBbox(tif.getImage(0).bbox);
      if (bounds == null) bounds = imgBounds;
      else bounds = bounds.union(imgBounds);
      files.push({
        name: tif.source.uri,
        ...imgBounds,
      });
    }
    if (tileMatrix == null) throw new Error('Unable to find the imagery tileMatrix');

    logger.info({ source }, 'CreateOverview: PrepareTiles');
    await this.prepareTiles(tiffs, maxZoom);
    if (this.tiles.size < 1) throw new Error('Failed to prepare tiles.');

    logger.info({ source }, 'CreateOverview: GenerateTiles');
    const promises = [];
    let currentTiles = Array.from(this.tiles);
    while (currentTiles.length > 0) {
      const todo = currentTiles.slice(0, WorkerTaskSize);
      currentTiles = currentTiles.slice(WorkerTaskSize);
      const jobTiles: JobTiles = { files, tileMatrix, tiles: todo };
      promises.push(pool.run('tile', jobTiles));
    }

    await Promise.all(promises);
    await pool.close();
    return;
  }

  async prepareTiles(tiffs: CogTiff[], maxZoom: number): Promise<void> {
    for (const tiff of tiffs) {
      const bbox = tiff.getImage(0).bbox;
      const geom: Polygon = { type: 'Polygon', coordinates: Bounds.fromBbox(bbox).toPolygon() };
      const tiles = cover.tiles(geom, { min_zoom: 5, max_zoom: maxZoom }); // TODO: What is min zoom here?
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
  }

  addChildren(qk: string, maxZoom: number): void {
    for (const child of QuadKey.children(qk)) {
      this.tiles.add(child);
      if (child.length < maxZoom) this.addChildren(child, maxZoom);
    }
  }
}
