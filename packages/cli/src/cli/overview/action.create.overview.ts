import { GoogleTms, NamedBounds, Nztm2000QuadTms, QuadKey, TileMatrixSet } from '@basemaps/geo';
import { LogConfig, LogType } from '@basemaps/shared';
import { ChunkSource, SourceMemory } from '@chunkd/core';
import { fsa } from '@chunkd/fs';
import { CogTiff } from '@cogeotiff/core';
import { CotarIndexBinary, CotarIndexBuilder, TarReader } from '@cotar/core';
import { TarBuilder } from '@cotar/tar';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { CogBuilder } from '../../cog/builder.js';
import { Cutline } from '../../cog/cutline.js';
import { filterTiff, MaxConcurrencyDefault } from '../../cog/job.factory.js';
import { createOverviewWmtsCapabilities } from './overview.wmts.js';
import { JobTiles, tile } from './tile.generator.js';

class SimpleTimer {
  lastTime: number;
  startTime: number;
  constructor() {
    this.lastTime = performance.now();
    this.startTime = this.lastTime;
  }

  tick(): number {
    const duration = Number((performance.now() - this.lastTime).toFixed(4));
    this.lastTime = performance.now();
    return duration;
  }
  total(): number {
    return Number((performance.now() - this.startTime).toFixed(4));
  }
}

const DefaultMaxZoom = 15;

export class CommandCreateOverview extends CommandLineAction {
  private source: CommandLineStringParameter;
  private maxZoom: CommandLineIntegerParameter;
  private output: CommandLineStringParameter;

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

    const st = new SimpleTimer();
    logger.debug({ source, path }, 'CreateOverview:ListTiffs');
    const tiffList = (await fsa.toArray(fsa.list(source))).filter(filterTiff);
    const tiffSource = tiffList.map((path: string) => fsa.source(path));
    logger.info({ source, path, duration: st.tick() }, 'CreateOverview:ListTiffs:Done');

    logger.debug({ source, path }, 'CreateOverview:PrepareSourceFiles');
    const tileMatrix = await this.getTileMatrix(tiffSource);
    logger.info({ source, path, duration: st.tick() }, 'CreateOverview:PrepareSourceFiles:Done');

    logger.debug({ source, path }, 'CreateOverview:PrepareCovering');
    const cutline = new Cutline(tileMatrix);
    const builder = new CogBuilder(tileMatrix, MaxConcurrencyDefault, logger);
    const metadata = await builder.build(tiffSource, cutline);
    logger.info({ source, path, duration: st.tick() }, 'CreateOverview:PrepareCovering:Done');

    logger.debug({ source, path }, 'CreateOverview:PrepareTiles');
    const tiles = await this.prepareTiles(metadata.files, maxZoom);
    if (tiles.size < 1) throw new Error('Failed to prepare overviews.');
    logger.info({ source, path, duration: st.tick() }, 'CreateOverview:PrepareTiles:Done');

    logger.debug({ source, path }, 'CreateOverview:GenerateTiles');
    const jobTiles: JobTiles = {
      path,
      files: metadata.bounds,
      tileMatrix: tileMatrix.identifier,
      tiles: Array.from(tiles.values()),
    };
    await tile(jobTiles, logger);
    logger.info({ source, path, duration: st.tick() }, 'CreateOverview:GenerateTiles:Done');

    const wmts = createOverviewWmtsCapabilities(tileMatrix, maxZoom);
    await fsa.write(fsa.join(path, 'WMTSCapabilities.xml'), wmts);

    logger.info({ source, path }, 'CreateOverview:CreatingTarFile');
    await this.createTar(path, logger);
    logger.debug({ source, path, duration: st.tick() }, 'CreateOverview:CreatingTarFile:Done');

    logger.info({ source, path, duration: st.total() }, 'CreateOverview:Done');
  }

  async prepareTiles(files: NamedBounds[], maxZoom: number): Promise<Set<string>> {
    const tiles = new Set<string>(['']);
    for (const file of files) {
      const name = file.name;
      const [z, x, y] = path.basename(name).replace('.tiff', '').split('-').map(Number);
      let qk = QuadKey.fromTile({ x, y, z });
      this.addChildren(qk, maxZoom, tiles);
      while (qk.length > 0) {
        if (tiles.has(qk)) break;
        if (qk.length < maxZoom) tiles.add(qk);
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

  async createTar(path: string, logger: LogType): Promise<void> {
    const tarFile = 'overviews.tar.co';
    const tarFilePath = fsa.join(path, tarFile);

    // Create tar file
    const tiles = await fsa.toArray(fsa.list(fsa.join(path, 'tiles')));
    tiles.push(fsa.join(path, 'WMTSCapabilities.xml'));

    const tarBuilder = new TarBuilder(tarFilePath);
    tiles.sort((a, b) => a.localeCompare(b));
    for (const file of tiles) await tarBuilder.write(file.slice(file.indexOf('tiles/')), await fsa.read(file));

    // Creating tar index
    const fd = await fs.open(tarFilePath, 'r');
    const index = await CotarIndexBuilder.create(fd);
    const indexBinary = await CotarIndexBinary.create(new SourceMemory('index', index.buffer));
    await TarReader.validate(fd, indexBinary);
    await fd.close();
    await fs.appendFile(tarFilePath, index.buffer);

    // Copy the output into s3 location
    const output = this.output.value;
    if (output) {
      const outputFile = fsa.join(output, tarFile);
      logger.info({ outputFile }, 'CreateOverview: UploadOutput');
      await fsa.write(outputFile, fsa.stream(tarFilePath));
    }
  }
}
