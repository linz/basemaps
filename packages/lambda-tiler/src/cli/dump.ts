import { Nztm2000Tms } from '@basemaps/geo';
import { LambdaAlbRequest } from '@linzjs/lambda';
import { LogConfig } from '@basemaps/shared';
import { ImageFormat } from '@basemaps/tiler';
import { promises as fs } from 'fs';
import { PrettyTransform } from 'pretty-json-log';
import { TileRoute } from '../routes/tile.js';
import { TileSet } from '../tile.set.js';
import { TileSets } from '../tile.set.cache.js';
import { TileSetLocal } from './tile.set.local.js';
import { Context } from 'aws-lambda';

if (process.stdout.isTTY) LogConfig.setOutputStream(PrettyTransform.stream());

const xyz = { x: 0, y: 0, z: 0 };
const tileMatrix = Nztm2000Tms;
const tileSetName = 'aerial';
const ext = ImageFormat.PNG;

/** Load a tileset form a file path otherwise default to the hard coded one from AWS */
async function getTileSet(filePath?: string): Promise<TileSet> {
  if (filePath != null) {
    const tileSet = new TileSetLocal('local', filePath);
    await tileSet.load();
    TileSets.add(tileSet);
    return tileSet;
  }

  const tileSet = await TileSets.get(tileSetName, tileMatrix);
  if (tileSet == null) throw new Error('Missing');
  return tileSet;
}

/**
 * Utility to render a single tile then save it as a png
 */
async function main(): Promise<void> {
  const logger = LogConfig.get();

  const filePath = process.argv[2];
  const tileSet = await getTileSet(filePath);

  logger.info({ ...xyz, projection: tileMatrix.projection.code, tileMatrix: tileMatrix.identifier }, 'RenderTile');

  const ctx = new LambdaAlbRequest(
    {
      httpMethod: 'get',
      path: `/v1/tiles/${tileSet.fullName}/${tileMatrix.identifier}/${xyz.z}/${xyz.x}/${xyz.y}.${ext}`,
    } as any,
    {} as Context,
    logger,
  );

  const tileData = await TileRoute.tile(ctx);

  const headers: Record<string, any> = {};
  for (const [key, value] of tileData.headers) headers[key] = value;

  logger.info({ ...tileData, _body: tileData.body?.length, headers }, 'Done');
  if (tileData._body != null) {
    await fs.writeFile(`output_${xyz.x}_${xyz.y}_z${xyz.z}.${ext}`, tileData._body);
  }
}

main().catch(console.error);
