import { WorkerRpc } from '@wtrpc/core';
import { parentPort } from 'node:worker_threads';
import { Bounds, ImageFormat, NamedBounds, QuadKey, Tile, TileMatrixSet } from '@basemaps/geo';
import { LogConfig } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import pLimit from 'p-limit';
import { CogTiff } from '@cogeotiff/core';
import { CoSources } from '@basemaps/lambda-tiler/build/util/source.cache.js';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';

export interface JobTiles {
  tileMatrix: TileMatrixSet;
  tiles: string[];
  files: NamedBounds[];
}

const Q = pLimit(2);

let count = 0;
let skipped = 0;

const worker = new WorkerRpc({
  async tile(jobTiles: JobTiles): Promise<void> {
    const logger = LogConfig.get().child({ workerId: worker.id, messageId: worker.messageCount });
    logger.info({ count, skipped }, 'TaskCount');

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

        const outputFile = `./tiles/${tile.z}/${tile.x}/${tile.y}.webp`;
        const exists = await fsa.exists(outputFile);
        if (exists) {
          skipped++;
          return;
        }
        const buffer = await getComposedTile(jobTiles, tile);
        await fsa.write(outputFile, buffer);
      });
    });

    await Promise.all(todo);
  },
});

if (parentPort) worker.bind(parentPort);

async function getComposedTile(jobTiles: JobTiles, tile: Tile): Promise<Buffer> {
  const files = jobTiles.files;
  const tileMatrix = jobTiles.tileMatrix;

  const tiffPaths: string[] = [];
  const tileBounds = tileMatrix.tileToSourceBounds(tile);
  for (const c of files) {
    if (!tileBounds.intersects(Bounds.fromJson(c))) continue;
    const tiffPath = c.name;
    tiffPaths.push(tiffPath);
  }

  const tiffs: CogTiff[] = [];
  for (const tiffPath of tiffPaths) {
    const tiff = await CoSources.getCog(tiffPath);
    tiffs.push(tiff);
  }

  const tiler = new Tiler(tileMatrix);
  const layers = await tiler.tile(tiffs, tile.x, tile.y, tile.z);

  // TODO: How to find the background and resizeKernel? and size 256?
  const TileComposer = new TileMakerSharp(256);
  const res = await TileComposer.compose({
    layers,
    format: ImageFormat.Webp,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    resizeKernel: { in: 'lanczos3', out: 'lanczos3' },
  });

  return res.buffer;
}
