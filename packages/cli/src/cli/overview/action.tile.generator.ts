import { LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import {
  Bounds,
  GoogleTms,
  ImageFormat,
  NamedBounds,
  Nztm2000QuadTms,
  Nztm2000Tms,
  QuadKey,
  Tile,
  TileMatrixSet,
} from '@basemaps/geo';
import { fsa } from '@chunkd/fs';
import pLimit from 'p-limit';
import { CogTiff } from '@cogeotiff/core';
import { CoSources } from '@basemaps/lambda-tiler/build/util/source.cache.js';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import Sharp from 'sharp';

const DefaultResizeKernel = { in: 'lanczos3', out: 'lanczos3' } as const;
const DefaultBackground = { r: 0, g: 0, b: 0, alpha: 0 };
const TileComposer = new TileMakerSharp(256);
const tilerNZTM2000Quad = new Tiler(Nztm2000QuadTms);
const tilerGoogle = new Tiler(GoogleTms);

const Q = pLimit(2);

export interface JobTile {
  path: string;
  tileMatrix: string;
  tiles: string[];
}

export class CommandTileGenerator extends CommandLineAction {
  private jobTile: CommandLineStringParameter;
  private files: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'tile-generator',
      summary: 'Generate tiles for overview',
      documentation: 'Generate Tiles for overview',
    });
  }

  protected onDefineParameters(): void {
    this.jobTile = this.defineStringParameter({
      argumentName: 'JOB_TILE',
      parameterLongName: '--job_tile',
      description: 'Tiles to create for the job',
      required: true,
    });
    this.files = this.defineStringParameter({
      argumentName: 'FILES',
      parameterLongName: '--files',
      description: 'Source files using to create tiles',
      required: true,
    });
  }

  async onExecute(): Promise<void> {
    const jobTileStr = this.jobTile.value;
    const filesStr = this.files.value;
    if (jobTileStr == null || filesStr == null)
      throw new Error('Please provide the job tile and files for generating tiles');
    let jobTiles: JobTile;
    try {
      jobTiles = JSON.parse(jobTileStr);
    } catch {
      throw new Error('Please provide a valid jobTiles');
    }
    let files: NamedBounds[];
    try {
      files = JSON.parse(filesStr);
    } catch {
      throw new Error('Please provide a valid files');
    }

    await tile(jobTiles, files);
  }
}

export async function tile(jobTiles: JobTile, files: NamedBounds[]): Promise<void> {
  const logger = LogConfig.get();
  let count = 0;
  let lastTime = performance.now();
  const todo = jobTiles.tiles.map((qk) => {
    return Q(async () => {
      const tile = QuadKey.toTile(qk);
      count++;
      if (count % 100 === 0) {
        const duration = performance.now() - lastTime;
        lastTime = Number(performance.now().toFixed(4));
        logger.info({ count, total: jobTiles.tiles.length, duration }, 'Progress');
      }

      const outputTile = `tiles/${tile.z}/${tile.x}/${tile.y}.webp`;
      const outputFile = fsa.join(jobTiles.path, outputTile);
      const exists = await fsa.exists(outputFile);
      if (exists) return;
      const buffer = await getComposedTile(jobTiles, files, tile);
      if (buffer != null) await fsa.write(outputFile, buffer);
    });
  });

  await Promise.all(todo);
}

async function getTiler(tileMatrix: string): Promise<{ tiler: Tiler; tileMatrix: TileMatrixSet }> {
  if (tileMatrix === GoogleTms.identifier) return { tiler: tilerGoogle, tileMatrix: GoogleTms };
  else if (tileMatrix === Nztm2000QuadTms.identifier || tileMatrix === Nztm2000Tms.identifier)
    return { tiler: tilerNZTM2000Quad, tileMatrix: Nztm2000QuadTms };
  else throw new Error(`Invalid Tile Matrix provided ${tileMatrix}`);
}

async function getComposedTile(jobTiles: JobTile, files: NamedBounds[], tile: Tile): Promise<Buffer | undefined> {
  const tiffPaths: string[] = [];
  const { tiler, tileMatrix } = await getTiler(jobTiles.tileMatrix);
  const tileBounds = tileMatrix.tileToSourceBounds(tile);
  for (const c of files) {
    if (!tileBounds.intersects(Bounds.fromJson(c))) continue;
    const tiffPath = c.name;
    tiffPaths.push(tiffPath);
  }

  const todoTiffs: Promise<CogTiff>[] = [];
  for (const tiffPath of tiffPaths) {
    const tiff = CoSources.getCog(tiffPath);
    todoTiffs.push(tiff);
  }

  const tiffs = await Promise.all(todoTiffs);
  const layers = await tiler.tile(tiffs, tile.x, tile.y, tile.z);
  if (layers.length === 0) return;
  const res = await TileComposer.compose({
    layers,
    format: ImageFormat.Webp,
    background: DefaultBackground,
    resizeKernel: DefaultResizeKernel,
  });
  if (res.layers === 0) return;

  // Check and skip if the buffer is empty webp
  if (res.buffer.byteLength < 215) {
    const image = Sharp(Buffer.from(res.buffer));
    const stat = await image.stats();
    if (stat.channels[stat.channels.length - 1].max === 0) return;
  }
  return res.buffer;
}
