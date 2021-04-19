import {
    ConfigImagery,
    ConfigImageryRule,
    ConfigTag,
    ConfigTileSet,
    ConfigTileSetRaster,
    TileSetType,
} from '@basemaps/config';
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

interface TileSetRuleImagery {
    rule: ConfigImageryRule;
    imagery: ConfigImagery;
}

export const TileSetTable = new CliTable<TileSetRuleImagery>();
TileSetTable.field('Rule Id', 30, (obj) => c.dim(obj.rule.id));
TileSetTable.field('Imagery Id', 30, (obj) => c.dim(obj.imagery.id));
TileSetTable.field('Name', 40, (obj) => obj.imagery.name);
TileSetTable.field('Zoom', 10, (obj) => obj.rule.minZoom + ' -> ' + obj.rule.maxZoom);
TileSetTable.field('CreatedAt', 10, (obj) => new Date(obj.imagery.createdAt).toISOString());

export async function printTileSetImagery(tsData: ConfigTileSetRaster, projection: Epsg): Promise<void> {
    const allImagery = await Config.TileSet.getImagery(tsData);
    const ruleImagery: TileSetRuleImagery[] = [];
    for (const rule of tsData.rules) {
        const imgId = Config.TileSet.getImageId(rule, projection);
        if (imgId != null) {
            const imagery = allImagery.get(imgId);
            if (imagery == null) continue;
            ruleImagery.push({ rule, imagery });
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
    console.log(c.bold('Version:'), `v${tsData.version}`);

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

export function showDiff(
    tsA: ConfigTileSetRaster | null,
    tsB: ConfigTileSetRaster | null,
    imageSet: Map<string, ConfigImagery>,
    projection: Epsg,
): string {
    let output = '';
    if (tsA != null) {
        for (const tsAImg of tsA.rules) {
            const tsBImg = tsB?.rules.find((rule) => rule.id === tsAImg.id);
            const imgId = Config.TileSet.getImageId(tsAImg, projection);
            const imagery = imageSet.get(imgId!)!;
            const lineA = TileSetTable.line({ rule: tsAImg, imagery });

            if (tsBImg == null) {
                output += c.green('\t+' + lineA) + '\n';
                continue;
            }

            const lineB = TileSetTable.line({ rule: tsBImg, imagery });
            if (lineA !== lineB) {
                output += c.green('\t+' + lineA) + '\n';
                output += c.red('\t-' + lineB) + '\n';
            }
        }
    }

    if (tsB != null) {
        for (const tsBImg of tsB.rules) {
            const tsAImg = tsA?.rules.find((rule) => rule.id === tsBImg.id);
            const imgId = Config.TileSet.getImageId(tsBImg, projection);
            const imagery = imageSet.get(imgId!)!;

            if (tsAImg == null) {
                const lineA = TileSetTable.line({ rule: tsBImg, imagery });
                output += c.red('\t-' + lineA) + '\n';
            }
        }
    }
    return output;
}

/**
 * Invalidate the cloudfront distribution cache when updating imagery sets
 */
export async function invalidateXYZCache(
    name: string,
    projection: Epsg,
    tag: ConfigTag | string,
    commit = false,
): Promise<void> {
    const nameStr = tag === Config.Tag.Production ? name : `${name}@${tag}`;
    const path = `/v1/tiles/${nameStr}/${projection.toEpsgString()}/*`;

    return invalidateCache(path, commit);
}
