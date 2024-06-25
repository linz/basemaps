import { ConfigProviderMemory } from '@basemaps/config';
import { initConfigFromUrls } from '@basemaps/config-loader';
import { Tile, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogConfig, setDefaultConfig } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaUrlRequest, UrlEvent } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import { extname } from 'path';

import { TileXyzRaster } from '../routes/tile.xyz.raster.js';

// Render configuration
const source = fsa.toUrl(`/home/blacha/data/elevation/christchurch_2020-2021/`);
const tile = fromPath('/14/7898/8615.webp');
const pipeline: string | null = 'color-ramp';
let tileMatrix: TileMatrixSet | null = null;

/** Convert a tile path /:z/:x/:y.png into a tile & extension */
function fromPath(s: string): Tile & { extension: string } {
  const ext = extname(s).slice(1);
  const parts = s.split('.')[0].split('/').map(Number);
  if (s.startsWith('/')) parts.shift();
  if (parts.length !== 3) throw new Error(`Invalid tile path ${s}`);
  return { z: parts[0], x: parts[1], y: parts[2], extension: ext };
}

async function main(): Promise<void> {
  const log = LogConfig.get();
  log.level = 'trace';
  const provider = new ConfigProviderMemory();
  setDefaultConfig(provider);
  const { imagery, tileSets } = await initConfigFromUrls(provider, [source]);

  const tileSet = tileSets.find((f) => f.layers.length > 0);

  if (tileSet == null || tileSet.layers.length === 0) throw new Error('No imagery found in path: ' + source.href);
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
