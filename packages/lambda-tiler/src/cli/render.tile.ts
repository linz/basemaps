import { ConfigProviderMemory } from '@basemaps/config';
import { initConfigFromUrls } from '@basemaps/config-loader';
import { TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogConfig, setDefaultConfig } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaUrlRequest, UrlEvent } from '@linzjs/lambda';
import { Context } from 'aws-lambda';

// import { extname } from 'path';
import { TileXyzRaster } from '../routes/tile.xyz.raster.js';

// Render configuration
const source = fsa.toUrl(
  `/home/blacha/git/linz/basemaps/packages/cli-raster/2193/new_zealand_10m_satellite_imagery_rgbi_2023/01K4V0K32RP08541PSWBER4TRT/`,
  // );
  // const source = fsa.toUrl(
  // `/home/blacha/git/linz/basemaps/packages/cli-raster/2193/new_zealand_10m_satellite_imagery_rgbi_2023/small/`,
);

// const tile = fromPath('//255/233.webp');
// const tile = { x: 1023, y: 933, z: 11, extension: 'webp' }; // fromPath('/13/4096/3734.webp');
// const tile = { x: 16383, y: 14931, z: 15, extension: 'png' }; // fromPath('/13/4096/3734.webp');
// const tile = { z: 6, x: 33, y: 30, extension: 'png' };

const tile = { z: 7, x: 66, y: 60, extension: 'png' };

const pipeline: string | null = 'false-color';
let tileMatrix: TileMatrixSet | null = null;

// console.log(QuadKey.children(QuadKey.fromTile(tile)).map((c) => console.log(QuadKey.toTile(c))));

// process.exit();
// https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/14/16141/10022.webp?api=c01jkxvnmgm1ehgmk23rp3e374f
// /** Convert a tile path /:z/:x/:y.png into a tile & extension */
// function fromPath(s: string): Tile & { extension: string } {
//   const ext = extname(s).slice(1);
//   const parts = s.split('.')[0].split('/').map(Number);
//   if (s.startsWith('/')) parts.shift();
//   if (parts.length !== 3) throw new Error(`Invalid tile path ${s}`);
//   return { z: parts[0], x: parts[1], y: parts[2], extension: ext };
// }

async function main(): Promise<void> {
  const log = LogConfig.get();
  log.level = 'trace';
  const provider = new ConfigProviderMemory();
  setDefaultConfig(provider);
  const { imagery } = await initConfigFromUrls(provider, [source]);

  // const img = imagery;

  // const tileSet = tileSets.find((f) => f.layers.length > 0);

  // if (tileSet == null || tileSet.layers.length === 0) throw new Error('No imagery found in path: ' + source.href);

  const tileSet = provider.imageryToTileSetByName(imagery[0]);
  // console.log(tileSet);
  // console.log(imagery);
  // tileSet.outputs = tileSet.outputs ?? [];
  // tileSet.outputs![0].resizeKernel = { in: 'nearest', out: 'nearest' };

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
