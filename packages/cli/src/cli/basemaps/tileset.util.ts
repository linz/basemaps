import { ConfigImagery, ConfigLayer, ConfigTileSet, ConfigTileSetRaster, TileSetType } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import { Config } from '@basemaps/shared';
import * as c from 'ansi-colors';
import { CliTable } from '../cli.table';
import { invalidateCache } from '../util';

/**
 * Convert a number to a two digit hex string. numbers < 16 are padded with '0'
 */
function numberToHexString(n: number): string {
    const ans = n.toString(16);
    return ans.length === 1 ? '0' + ans : ans;
}
export function rgbaToHex(c: { r: number; g: number; b: number; alpha: number }): string {
    return numberToHexString(c.r) + numberToHexString(c.g) + numberToHexString(c.b) + numberToHexString(c.alpha);
}

interface TileSetLayerImagery {
    layer: ConfigLayer;
    imagery: ConfigImagery;
}

export const TileSetTable = new CliTable<TileSetLayerImagery>();
TileSetTable.field('Imagery Id', 30, (obj) => c.dim(obj.imagery.id));
TileSetTable.field('Name', 40, (obj) => obj.imagery.name);
TileSetTable.field('Zoom', 10, (obj) => obj.layer.minZoom + ' -> ' + obj.layer.maxZoom);
TileSetTable.field('CreatedAt', 10, (obj) => new Date(obj.imagery.createdAt).toISOString());

export async function printTileSetImagery(tsData: ConfigTileSetRaster, projection: Epsg): Promise<void> {
    const allImagery = await Config.getTileSetImagery(tsData);
    const ruleImagery: TileSetLayerImagery[] = [];
    for (const layer of tsData.layers) {
        const imgId = Config.getImageId(layer, projection);
        if (imgId != null) {
            const imagery = allImagery.get(imgId);
            if (imagery == null) continue;
            ruleImagery.push({ layer, imagery });
        }
    }
    console.log('');
    TileSetTable.header();
    TileSetTable.print(ruleImagery);
}

export async function printTileSet(tsData: ConfigTileSet, projection: Epsg, printImagery = true): Promise<void> {
    console.log(c.bold('TileSet:'), `${tsData.name} `);
    console.log(c.bold('CreatedAt:'), new Date(tsData.createdAt).toISOString());
    console.log(c.bold('UpdatedAt:'), new Date(tsData.updatedAt).toISOString());

    if (tsData.type === TileSetType.Vector) return;
    if (tsData.background) {
        console.log(c.bold('Background'), tsData.background);
    }
    if (tsData.resizeKernel) {
        console.log(
            c.bold('ResizeKernel:'),
            c.dim('in'),
            tsData.resizeKernel.in,
            c.dim('out'),
            tsData.resizeKernel.out,
        );
    }

    if (printImagery) await printTileSetImagery(tsData, projection);
}

/**
 * Invalidate the cloudfront distribution cache when updating imagery sets
 */
export async function invalidateXYZCache(name: string, projection: Epsg, commit = false): Promise<void> {
    const path = `/v1/tiles/${name}/${projection.toEpsgString()}/*`;

    return invalidateCache(path, commit);
}
