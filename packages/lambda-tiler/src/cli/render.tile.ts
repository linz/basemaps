import { ConfigProviderMemory } from '@basemaps/config';
import { initConfigFromPaths } from '@basemaps/config/build/json/tiff.config.js';
import { ImageFormat, Nztm2000QuadTms } from '@basemaps/geo';
import { LogConfig, setDefaultConfig } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { LambdaHttpRequest, LambdaUrlRequest, UrlEvent } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import { TileXyzRaster } from '../routes/tile.xyz.raster.js';

const target = `/home/blacha/tmp/basemaps/`;
const tile = { z: 18, x: 126359, y: 137603 };
const tileMatrix = Nztm2000QuadTms;

async function main(): Promise<void> {
  const log = LogConfig.get();
  const provider = new ConfigProviderMemory();
  setDefaultConfig(provider);
  const { tileSet, imagery } = await initConfigFromPaths(provider, [target]);

  if (tileSet.layers.length === 0) throw new Error('No imagery found in path: ' + target);
  log.info({ tileSet: tileSet.name, layers: tileSet.layers.length }, 'TileSet:Loaded');
  for (const im of imagery) {
    log.info({ imagery: im.uri, title: im.title, tileMatrix: im.tileMatrix, files: im.files.length }, 'Imagery:Loaded');
  }
  const request = new LambdaUrlRequest({ headers: {} } as UrlEvent, {} as Context, log) as LambdaHttpRequest;

  const res = await TileXyzRaster.tile(request, tileSet, {
    tile,
    tileMatrix,
    tileSet: tileSet.id,
    tileType: ImageFormat.Png,
  });

  await fsa.write(`./${tile.z}_${tile.x}_${tile.y}.png`, Buffer.from(res.body, 'base64'));
}

main();
