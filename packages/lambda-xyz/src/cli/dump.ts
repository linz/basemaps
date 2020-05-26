import { LogConfig, LambdaContext, TileType } from '@basemaps/lambda-shared';
import { PrettyTransform } from 'pretty-json-log';
import { Tile } from '../routes/tile';
import { Epsg } from '@basemaps/geo';
import { TileSetLocal } from './tile.set.local';
import { TileSets } from '../tile.set.cache';
import { ImageFormat } from '@basemaps/tiler';
import { writeFileSync } from 'fs';

if (process.stdout.isTTY) LogConfig.setOutputStream(PrettyTransform.stream());

const xyz = { x: 271, y: 192, z: 9 };
const ext = ImageFormat.PNG;

async function main(): Promise<void> {
    const logger = LogConfig.get();
    const filePath = process.argv[2];
    if (filePath == null) throw new Error('Usage: ./dump image-path');

    const tileSet = new TileSetLocal('local', Epsg.Google, filePath);
    await tileSet.load();
    TileSets.set(tileSet.id, tileSet);
    const projection = tileSet.projection;

    logger.info({ ...xyz, projection }, 'RenderTile');

    const ctx = new LambdaContext(
        {
            httpMethod: 'get',
            path: `/v1/tiles/${tileSet.name}/${projection.code}/${xyz.z}/${xyz.x}/${xyz.y}.${ext}`,
        } as any,
        logger,
    );

    const tileData = await Tile(ctx, { ...xyz, projection, name: tileSet.name, ext, type: TileType.Image });

    await writeFileSync(`output.${ext}`, tileData.body);
    console.log(tileData);
}

main().catch(console.error);
