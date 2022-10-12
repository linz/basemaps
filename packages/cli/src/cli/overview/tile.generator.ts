import { WorkerRpc } from '@wtrpc/core';
import { parentPort } from 'node:worker_threads';
import { Bounds, Epsg, ImageFormat, QuadKey, Tile, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { getDefaultConfig, LogConfig } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import pLimit from 'p-limit';
import { getTiffName, TileComposer } from '@basemaps/lambda-tiler/build/routes/tile.xyz.raster.js';
import { ConfigTileSetRaster, getAllImagery, TileSetType } from '@basemaps/config';
import { CogTiff } from '@cogeotiff/core';
import { CoSources } from '@basemaps/lambda-tiler/build/util/source.cache.js';
import { Tiler } from '@basemaps/tiler';

export interface JobTiles {
  id: string;
  tileMatrix: string;
  tiles: string[];
}

const Q = pLimit(2);

let count = 0;
let skipped = 0;

const worker = new WorkerRpc({
  async tile(jobTiles: JobTiles): Promise<void> {
    const logger = LogConfig.get().child({ workerId: worker.id, messageId: worker.messageCount });
    logger.info({ count, skipped }, 'TaskCount');
    const config = getDefaultConfig();
    const tileSet = await config.TileSet.get(config.TileSet.id(jobTiles.id));
    if (tileSet == null || tileSet.type === TileSetType.Raster)
      throw new Error(`Unable to find tileset for id: ${jobTiles.id}`);
    const tileMatrix = TileMatrixSets.find(jobTiles.tileMatrix);
    if (tileMatrix == null) throw new Error(`Unable to find tileMatrix for ${jobTiles.tileMatrix}`);

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
        const buffer = await getComposedTile(tileSet as unknown as ConfigTileSetRaster, tileMatrix, tile);
        await fsa.write(outputFile, buffer);
      });
    });

    await Promise.all(todo);
  },
});

if (parentPort) worker.bind(parentPort);

async function getComposedTile(tileSet: ConfigTileSetRaster, tileMatrix: TileMatrixSet, tile: Tile): Promise<Buffer> {
  const config = getDefaultConfig();

  const imagery = await getAllImagery(config, tileSet.layers, [tileMatrix.projection]);
  const tiffPaths: string[] = [];
  const tileBounds = tileMatrix.tileToSourceBounds(tile);
  // All zoom level config is stored as Google zoom levels
  const filterZoom = TileMatrixSet.convertZoomLevel(tile.z, tileMatrix, TileMatrixSets.get(Epsg.Google));
  for (const layer of tileSet.layers) {
    if (layer.maxZoom != null && filterZoom > layer.maxZoom) continue;
    if (layer.minZoom != null && filterZoom < layer.minZoom) continue;

    const imgId = layer[tileMatrix.projection.code];
    if (imgId == null) throw new Error(`Failed to find imagery from tileset`);

    const img = imagery.get(imgId);
    if (img == null) throw new Error(`Unable to find imagery for id: ${imgId}`);
    if (!tileBounds.intersects(Bounds.fromJson(img.bounds))) continue;

    for (const c of img.files) {
      if (!tileBounds.intersects(Bounds.fromJson(c))) continue;
      const tiffPath = fsa.join(img.uri, getTiffName(c.name));
      tiffPaths.push(tiffPath);
    }
  }

  const tiffs: CogTiff[] = [];
  for (const tiffPath of tiffPaths) {
    const tiff = await CoSources.getCog(tiffPath);
    tiffs.push(tiff);
  }

  const tiler = new Tiler(tileMatrix);
  const layers = await tiler.tile(tiffs, tile.x, tile.y, tile.z);

  const res = await TileComposer.compose({
    layers,
    format: ImageFormat.Webp,
    background: tileSet.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    resizeKernel: tileSet.resizeKernel ?? { in: 'lanczos3', out: 'lanczos3' },
  });

  return res.buffer;
}
