import { TileSet } from './tile.set';
import { LambdaContext } from '@basemaps/lambda';
import { Epsg } from '@basemaps/geo';

export const TileSets = new Map<string, TileSet>();

export function getTileSet(name: string, projection: Epsg): TileSet | undefined {
    const tileSetId = `${name}_${projection}`;
    return TileSets.get(tileSetId);
}

export async function loadTileSet(req: LambdaContext, name: string, projection: Epsg): Promise<TileSet | null> {
    req.set('tileSet', name);
    req.set('projection', projection);
    let tileSet = getTileSet(name, projection);
    if (tileSet == null) {
        tileSet = new TileSet(name, projection);
        TileSets.set(tileSet.id, tileSet);
    }
    req.timer.start('tileset:load');
    const loaded = await tileSet.load();
    req.timer.end('tileset:load');
    if (!loaded) {
        TileSets.delete(tileSet.id);
        return null;
    }
    return tileSet;
}
