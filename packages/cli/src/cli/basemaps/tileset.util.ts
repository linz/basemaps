import { ConfigImagery, ConfigLayer, ConfigTileSet, ConfigTileSetRaster, TileSetType } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import { Config } from '@basemaps/shared';
import * as c from 'ansi-colors';
import { CliTable } from '../cli.table';
import { invalidateCache } from '../util';

/**
 * Parse a string as hex, return 0 on failure
 * @param str string to parse
 */
function parseHex(str: string): number {
    if (str === '') return 0;
    const val = parseInt(str, 16);
    if (isNaN(val)) {
        throw new Error('Invalid hex byte: ' + str);
    }
    return val;
}

/**
 * Parse a hexstring into RGBA
 *
 * Defaults to 0 if missing values
 * @param str string to parse
 */
export function parseRgba(str: string): { r: number; g: number; b: number; alpha: number } {
    if (str.startsWith('0x')) str = str.slice(2);
    else if (str.startsWith('#')) str = str.slice(1);
    if (str.length !== 6 && str.length !== 8) {
        throw new Error('Invalid hex color: ' + str);
    }
    return {
        r: parseHex(str.substr(0, 2)),
        g: parseHex(str.substr(2, 2)),
        b: parseHex(str.substr(4, 2)),
        alpha: parseHex(str.substr(6, 2)),
    };
}

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
    const allImagery = await Config.TileSet.getImagery(tsData);
    const ruleImagery: TileSetLayerImagery[] = [];
    for (const layer of tsData.layers) {
        const imgId = Config.TileSet.getImageId(layer, projection);
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
