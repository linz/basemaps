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
import { CoSources } from '@basemaps/lambda-tiler/build/util/source.cache.js';
import { LogType } from '@basemaps/shared';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { fsa } from '@chunkd/fs';
import { CogTiff } from '@cogeotiff/core';
import pLimit from 'p-limit';
import Sharp from 'sharp';

import { SimpleTimer } from './timer.js';

const DefaultResizeKernel = { in: 'lanczos3', out: 'lanczos3' } as const;
const DefaultBackground = { r: 0, g: 0, b: 0, alpha: 0 };
const TileComposer = new TileMakerSharp(256);
const tilerNZTM2000Quad = new Tiler(Nztm2000QuadTms);
const tilerGoogle = new Tiler(GoogleTms);

function getTiler(tileMatrix: string): { tiler: Tiler; tileMatrix: TileMatrixSet } {
  if (tileMatrix === GoogleTms.identifier) return { tiler: tilerGoogle, tileMatrix: GoogleTms };
  else if (tileMatrix === Nztm2000QuadTms.identifier || tileMatrix === Nztm2000Tms.identifier)
    return { tiler: tilerNZTM2000Quad, tileMatrix: Nztm2000QuadTms };
  else throw new Error(`Invalid Tile Matrix provided ${tileMatrix}`);
}

export interface JobTiles {
  path: string;
  tileMatrix: string;
  tiles: string[];
  files: NamedBounds[];
}

const Q = pLimit(20);

export type RpcContract = {
  tile(jobTiles: JobTiles): Promise<void>;
};

export async function tile(jobTiles: JobTiles, logger: LogType): Promise<void> {
  const timer = new SimpleTimer();
  let count = 0;
  let skipped = 0;

  const todo = jobTiles.tiles.map((qk) => {
    return Q(async () => {
      const tile = QuadKey.toTile(qk);
      count++;
      if (count % 100 === 0) {
        logger.info({ count, total: jobTiles.tiles.length, duration: timer.tick() }, 'Tiles:Progress');
      }

      const outputTile = `tiles/${tile.z}/${tile.x}/${tile.y}.webp`;
      const outputFile = fsa.join(jobTiles.path, outputTile);
      const exists = await fsa.exists(outputFile);
      if (exists) {
        skipped++;
        return;
      }
      const buffer = await getComposedTile(jobTiles, tile);
      if (buffer != null) await fsa.write(outputFile, buffer);
    });
  });

  await Promise.all(todo);
  logger.info({ count, skipped, duration: timer.total() }, 'Tiles:Created');
}

async function getComposedTile(jobTiles: JobTiles, tile: Tile): Promise<Buffer | undefined> {
  const files = jobTiles.files;
  const tiffPaths: string[] = [];
  const { tiler, tileMatrix } = getTiler(jobTiles.tileMatrix);
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
