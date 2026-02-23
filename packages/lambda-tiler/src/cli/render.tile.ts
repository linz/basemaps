import { ConfigImagery, ConfigProviderMemory, ConfigTileSetRaster } from '@basemaps/config';
import { initConfigFromUrls } from '@basemaps/config-loader';
import { Tile, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, FsaLocalCache, LogConfig, setDefaultConfig } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaUrlRequest, UrlEvent } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import { extname } from 'path';

import { TileXyzRaster } from '../routes/tile.xyz.raster.js';

const sourceRaw = process.argv[2];
const tilePath = process.argv[3];
const pipeline = process.argv[4];

if (sourceRaw == null || tilePath == null) {
  // eslint-disable-next-line no-console
  console.log(`Usage: render-tile <source-imagery> tilePath
  eg:

  # render tile: {z:3, x:2, y:3} as a webmercator png
  render-tile /home/data/nz 3/2/3.png 

  # Render a false-color pipeline
  render-tile /home/data/nz 3/2/3.png false-color
  `);
  process.exit(1);
}

fsa.middleware.push(FsaLocalCache);

const source = fsa.toUrl(sourceRaw);
const tile = fromPath(tilePath);
let tileMatrix: TileMatrixSet | null = null;

/** Convert a tile path /:z/:x/:y.png into a tile & extension */
function fromPath(s: string): Tile & { extension: string } {
  const ext = extname(s).slice(1);
  const parts = s.split('.')[0].split('/').map(Number);
  if (s.startsWith('/')) parts.shift();
  if (parts.length !== 3) throw new Error(`Invalid tile path ${s}`);
  const tile = { z: parts[0], x: parts[1], y: parts[2], extension: ext };

  if (isNaN(tile.z) || isNaN(tile.x) || isNaN(tile.y)) {
    throw new Error('Unable to parse tile: ' + s);
  }
  return tile;
}

async function loadConfig(
  url: URL,
): Promise<{ tileSet: ConfigTileSetRaster; imagery: ConfigImagery[]; cfg: ConfigProviderMemory }> {
  if (url.pathname.endsWith('.json') || url.pathname.endsWith('.json.gz')) {
    const cfg = ConfigProviderMemory.fromJson(await fsa.readJson(url), url);
    LogConfig.get().info({ url: url.href }, 'ConfigLoaded');
    const imagery = [...cfg.objects.values()].filter((f) => f.id.startsWith('im_')) as ConfigImagery[];
    return { tileSet: cfg.imageryToTileSetByName(imagery[0]), imagery, cfg };
  }

  const cfg = new ConfigProviderMemory();
  const { imagery } = await initConfigFromUrls(cfg, [url]);
  return { tileSet: cfg.imageryToTileSetByName(imagery[0]), imagery, cfg };
}

async function main(): Promise<void> {
  const log = LogConfig.get();
  log.level = 'debug';

  const { tileSet, imagery, cfg } = await loadConfig(source);
  setDefaultConfig(cfg);

  log.info({ tileSet: tileSet.name, layers: tileSet.layers.length }, 'TileSet:Loaded');

  for (const im of imagery) {
    log.info({ url: im.uri, title: im.title, tileMatrix: im.tileMatrix, files: im.files.length }, 'Imagery:Loaded');
    if (tileMatrix == null) {
      tileMatrix = TileMatrixSets.find(im.tileMatrix);
      log.info({ tileMatrix: im.tileMatrix }, 'Imagery:TileMatrix:Set');
    }
  }

  if (tileMatrix == null) throw new Error('No tileMatrix found');
  const request = new LambdaUrlRequest({ headers: {} } as UrlEvent, {} as Context, log) as LambdaHttpRequest;

  tileSet.background = { r: 255, g: 0, b: 255, alpha: 0.25 };
  const res = await TileXyzRaster.tile(request, tileSet, {
    tile,
    tileMatrix,
    tileSet: tileSet.id,
    tileType: tile.extension,
    pipeline,
  });
  const pipelineName = pipeline ? `-${pipeline}` : '';

  const fileName = `./render/${tile.z}_${tile.x}_${tile.y}${pipelineName}.${tile.extension}`;
  await fsa.write(fsa.toUrl(fileName), Buffer.from(res.body, 'base64'));
  log.info({ path: fileName, ...request.timer.metrics }, 'Tile:Write');
}

main().catch((e) => {
  LogConfig.get().fatal({ err: e }, 'Cli:Failed');
});
