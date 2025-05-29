import sq from 'node:sqlite';

import { LogType } from '@basemaps/shared';
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

export function* readMbTiles(
  fileName: string,
  limit = -1,
  logger: LogType,
): Generator<{ tile: TileTable; index: number; total: number }, null> {
  logger.debug({ file: fileName }, 'ReadMbTiles:Start');

  const db = new sq.DatabaseSync(fileName);

  let limitQuery = '';
  if (limit > 0) limitQuery = `LIMIT ${limit}`;

  const getAll = db.prepare('SELECT count(*) as count FROM tiles;');
  const totalRow = getAll.get();
  const total = totalRow ? (totalRow['count'] as number) : 0;

  const getTiles = db.prepare(`SELECT * FROM tiles ORDER BY zoom_level ${limitQuery}`);
  const tiles = getTiles.all();

  let index = 0;
  for (const data of tiles) {
    const tile: TileTable = {
      zoom_level: data['zoom_level'] as number,
      tile_column: data['tile_column'] as number,
      tile_row: data['tile_row'] as number,
      tile_data: Buffer.from(data['tile_data'] as Uint8Array),
    };
    yield { tile, index: index++, total };
  }

  logger.debug({ file: fileName }, 'ReadMbTiles:End');
  return null;
}

export async function toTarTiles(input: string, output: string, logger: LogType, limit = -1): Promise<void> {
  const packer = tar.pack();
  const startTime = Date.now();
  let writeCount = 0;
  const writeProm = new Promise((resolve) => packer.on('end', resolve));

  packer.pipe(createWriteStream(output));

  let startTileTime = Date.now();
  for await (const { tile, index, total } of readMbTiles(input, limit, logger)) {
    if (index === 0) logger.info({ path: output, count: total }, 'Covt.Tar:Start');

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
  logger.info({ path: output, count: writeCount, duration: Date.now() - startTime }, 'Covt.Tar:Done');
}
