import { ConfigProviderMemory } from '@basemaps/config';
import { initConfigFromUrls } from '@basemaps/config/build/json/tiff.config.js';
import { GoogleTms, ImageFormat } from '@basemaps/geo';
import { LogConfig, setDefaultConfig } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { LambdaHttpRequest, LambdaUrlRequest, UrlEvent } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import { TileXyzRaster } from '../routes/tile.xyz.raster.js';
import { pathToFileURL } from 'url';

const target = pathToFileURL(`/home/blacha/tmp/basemaps/white-lines/nz-0.5m/`);
const tile = { z: 10, x: 1013, y: 633 };
const tileMatrix = GoogleTms;
const imageFormat = ImageFormat.Webp;

async function main(): Promise<void> {
  const log = LogConfig.get();
  const provider = new ConfigProviderMemory();
  setDefaultConfig(provider);
  const { tileSet, imagery } = await initConfigFromUrls(provider, [target]);

  if (tileSet.layers.length === 0) throw new Error('No imagery found in path: ' + target);
  log.info({ tileSet: tileSet.name, layers: tileSet.layers.length }, 'TileSet:Loaded');
  for (const im of imagery) {
    log.info({ url: im.uri, title: im.title, tileMatrix: im.tileMatrix, files: im.files.length }, 'Imagery:Loaded');
  }
  const request = new LambdaUrlRequest({ headers: {} } as UrlEvent, {} as Context, log) as LambdaHttpRequest;

  tileSet.background = { r: 255, g: 255, b: 255, alpha: 1 };
  const res = await TileXyzRaster.tile(request, tileSet, {
    tile,
    tileMatrix,
    tileSet: tileSet.id,
    tileType: imageFormat,
  });

  await fsa.write(`./${tile.z}_${tile.x}_${tile.y}.${imageFormat}`, Buffer.from(res.body, 'base64'));
  log.info({ path: `./${tile.z}_${tile.x}_${tile.y}.${imageFormat}` }, 'Tile:Write');
}

main();
