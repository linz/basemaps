import { ConfigProviderMemory } from '@basemaps/config';
import { initConfigFromUrls } from '@basemaps/config/build/json/tiff.config.js';
import { ImageFormat, Tile, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { LogConfig, setDefaultConfig } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { LambdaHttpRequest, LambdaUrlRequest, UrlEvent } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import { pathToFileURL } from 'url';

import { TileXyzRaster } from '../routes/tile.xyz.raster.js';

const target = pathToFileURL(`/home/blacha/tmp/imagery/southland-0.25-rural-2023/`);
const tile = fromPath('/18/117833/146174.webp');

const outputFormat = ImageFormat.Webp;
let tileMatrix: TileMatrixSet | null = null;

/** Convert a tile path /:z/:x/:y.png into a tile */
function fromPath(s: string): Tile {
  const parts = s.split('.')[0].split('/').map(Number);
  if (s.startsWith('/')) parts.shift();
  if (parts.length !== 3) throw new Error(`Invalid tile path ${s}`);
  return { z: parts[0], x: parts[1], y: parts[2] };
}

async function main(): Promise<void> {
  const log = LogConfig.get();
  const provider = new ConfigProviderMemory();
  setDefaultConfig(provider);
  const { tileSet, imagery } = await initConfigFromUrls(provider, [target]);

  if (tileSet.layers.length === 0) throw new Error('No imagery found in path: ' + target);
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
    tileType: outputFormat,
  });

  await fsa.write(`./${tile.z}_${tile.x}_${tile.y}.${outputFormat}`, Buffer.from(res.body, 'base64'));
  log.info({ path: `./${tile.z}_${tile.x}_${tile.y}.${outputFormat}` }, 'Tile:Write');
}

main();
