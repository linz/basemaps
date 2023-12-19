import { ConfigProviderMemory, TileSetType } from '@basemaps/config';
import { ConfigTileSet, ConfigTileSetComputed } from '@basemaps/config/src/config/tile.set.js';
import { initConfigFromUrls } from '@basemaps/config-loader';
import { ImageFormat, Tile, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogConfig, setDefaultConfig } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaHttpResponse, LambdaUrlRequest, UrlEvent } from '@linzjs/lambda';
import { Context } from 'aws-lambda';

import { TileXyzComputed } from '../routes/tile.xyz.computed.js';
import { TileXyzRaster } from '../routes/tile.xyz.raster.js';
import { tileXyzVector } from '../routes/tile.xyz.vector.js';
import { CoSources } from '../util/source.cache.js';
import { TileXyz } from '../util/validate.js';

const target = fsa.toUrl(
  // `/home/blacha/git/linz/basemaps/packages/cogify/target/3857/nz-8m-dem-2012/01HGF1TK0Z8QN86BTFGJXTTZYF/`,

  '/home/blacha/git/linz/basemaps/packages/cogify/target/3857/source/01HFZKCB6VM25NHD9A88Z23XF5/',
);
const tile = fromPath('/7/125/79.color-ramp.webp');
// const tile = fromPath('/2/3/2.color-ramp.webp');

const outputFormat = ImageFormat.Webp;
let tileMatrix: TileMatrixSet | null = null;

/** Convert a tile path /:z/:x/:y.png into a tile */
function fromPath(s: string): Tile & { extension: string } {
  const split = s.split('.');
  const parts = split[0].split('/').map(Number);
  if (s.startsWith('/')) parts.shift();
  if (parts.length !== 3) throw new Error(`Invalid tile path ${s}`);
  return { z: parts[0], x: parts[1], y: parts[2], extension: split.slice(1).join('.') };
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

  const computed = tileSet as unknown as ConfigTileSetComputed;
  computed.type = TileSetType.Computed;
  computed.outputs = [
    {
      title: 'Terrain RGB',
      extension: 'terrain-rgb.webp',
      pipeline: [{ function: 'terrain-rgb' }],
      output: { type: 'webp', lossless: true, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    },
    {
      title: 'Terrain RGB',
      extension: 'color-ramp.webp',
      pipeline: [{ function: 'color-ramp', ramp: [] }],
      output: { type: 'webp', level: 80, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    },
  ];
  const res = await createTile(request, tileSet, {
    tile,
    tileMatrix,
    tileSet: computed.name,
    tileType: tile.extension,
  });

  await fsa.write(fsa.toUrl(`./${tile.z}_${tile.x}_${tile.y}.${outputFormat}`), Buffer.from(res.body, 'base64'));
  log.info({ path: `./${tile.z}_${tile.x}_${tile.y}.${outputFormat}` }, 'Tile:Write');

  console.log(CoSources);
  await CoSources.clear();
}

function createTile(req: LambdaHttpRequest, tileSet: ConfigTileSet, xyzData: TileXyz): Promise<LambdaHttpResponse> {
  switch (tileSet.type) {
    case TileSetType.Vector:
      return tileXyzVector.tile(req, tileSet, xyzData);
    case TileSetType.Raster:
      return TileXyzRaster.tile(req, tileSet, xyzData);
    case TileSetType.Computed:
      return TileXyzComputed.tile(req, tileSet, xyzData);
    default:
      return Promise.resolve(new LambdaHttpResponse(400, 'Invalid tileset'));
  }
}

main().catch((e) => LogConfig.get().fatal(e, 'Failed'));
