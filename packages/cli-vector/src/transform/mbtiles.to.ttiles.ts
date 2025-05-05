import { LogType } from '@basemaps/shared';
import bs3 from 'better-sqlite3';
import { createWriteStream } from 'fs';
import * as tar from 'tar-stream';

export interface TileTable {
  zoom_level: number;
  tile_column: number;
  tile_row: number;
  tile_data: Buffer;
}

export function xyzToPath(x: number | string, y: number | string, z: number | string, compressed = true): string {
  return `tiles/${z}/${x}/${y}.pbf` + (compressed ? '.gz' : '');
}

export async function* readMbTiles(
  fileName: URL,
  limit = -1,
): AsyncGenerator<{ tile: TileTable; index: number; total: number }, null> {
  const db = bs3(fileName.pathname);

  let limitQuery = '';
  if (limit > 0) limitQuery = 'LIMIT ' + limit;

  const total = await db.prepare('SELECT count(*) from tiles;').pluck().get();
  const query = db.prepare(`SELECT * from tiles order by zoom_level ${limitQuery}`);

  let index = 0;
  for (const tile of query.iterate()) yield { tile: tile as TileTable, index: index++, total: total as number };
  return null;
}

export async function toTarTiles(fileName: URL, tarFileName: URL, logger: LogType, limit = -1): Promise<void> {
  const packer = tar.pack();
  const startTime = Date.now();
  let writeCount = 0;
  const writeProm = new Promise((resolve) => packer.on('end', resolve));

  packer.pipe(createWriteStream(tarFileName));

  let startTileTime = Date.now();
  for await (const { tile, index, total } of readMbTiles(fileName, limit)) {
    if (index === 0) logger.info({ path: tarFileName, count: total }, 'Covt.Tar:Start');

    const z = tile.zoom_level;
    const x = tile.tile_column;
    const y = tile.tile_row;

    const tileName = xyzToPath(x, y, z);
    const tileData = tile.tile_data;
    packer.entry({ name: tileName }, tileData);
    if (writeCount % 25_000 === 0) {
      const percent = ((writeCount / index) * 100).toFixed(2);
      const duration = Date.now() - startTileTime;
      startTileTime = Date.now();
      logger.debug({ current: writeCount, total: total, percent, duration }, 'Covt.Tar:WriteTile');
    }
    writeCount++;
  }

  logger.debug('Covt.Tar:Finalize');
  packer.finalize();
  await writeProm;
  logger.info({ path: tarFileName, count: writeCount, duration: Date.now() - startTime }, 'Covt.Tar:Done');
}
