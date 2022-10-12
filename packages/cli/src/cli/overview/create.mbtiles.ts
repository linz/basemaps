import { fsa } from '@chunkd/fs';
import { MBTiles } from '@mapbox/mbtiles/lib/mbtiles.js';
import { LogType } from '@basemaps/shared';

async function createMBtiles(path: string, logger: LogType) {
  const mb = await new Promise((r) => new MBTiles('output.mbtiles?mode=rwc', (mb) => r(mb)));

  let count = 0;

  await new Promise((r) => mb.startWriting(r));

  for await (const tile of fsa.list('./tiles')) {
    if (!tile.endsWith('.webp')) continue;

    const parts = tile.replace('.webp', '').split('/');

    const z = Number(parts[parts.length - 3]);
    const x = Number(parts[parts.length - 2]);
    const y = Number(parts[parts.length - 1]);
    count++;
    if (count % 1000 === 0) logger.info({ count }, 'MBtiles:Counts');

    const buf = await fsa.read(tile);
    await new Promise((r) => mb.putTile(z, x, y, buf, r));
  }

  await new Promise((r) => mb.stopWriting(r));
}
