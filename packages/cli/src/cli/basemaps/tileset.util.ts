import { Epsg } from '@basemaps/geo';
import {
    Aws,
    TileMetadataImageryRecord,
    TileMetadataSetRecord,
    TileMetadataTag,
    TileSetRuleImagery,
} from '@basemaps/lambda-shared';
import * as c from 'ansi-colors';
import { CliTable } from '../cli.table';
import { invalidateCache } from '../util';

export const TileSetTable = new CliTable<TileSetRuleImagery>();
TileSetTable.field('#', 4, (obj) => String(obj.rule.priority));
TileSetTable.field('Id', 30, (obj) => c.dim(obj.rule.id));
TileSetTable.field('Name', 40, (obj) => obj.imagery.name);
TileSetTable.field('Zoom', 10, (obj) => obj.rule.minZoom + ' -> ' + obj.rule.maxZoom);
TileSetTable.field('CreatedAt', 10, (obj) => new Date(obj.imagery.createdAt).toISOString());

export async function printTileSetImagery(tsData: TileMetadataSetRecord): Promise<void> {
    TileSetTable.print(await Aws.tileMetadata.Imagery.getAll(tsData));
}

export async function printTileSet(tsData: TileMetadataSetRecord, printImagery = true): Promise<void> {
    console.log(c.bold('TileSet:'), `${tsData.name} `);
    console.log(c.bold('CreatedAt:'), new Date(tsData.createdAt).toISOString());
    console.log(c.bold('UpdatedAt:'), new Date(tsData.updatedAt).toISOString());
    console.log(c.bold('Version:'), `v${tsData.version}`);
    if (tsData.background) {
        console.log(c.bold('Background'), tsData.background);
    }

    if (printImagery) await printTileSetImagery(tsData);
}

export function showDiff(
    tsA: TileMetadataSetRecord,
    tsB: TileMetadataSetRecord,
    imageSet: Map<string, TileMetadataImageryRecord>,
): string {
    let output = '';
    for (const tsAImg of Object.values(tsA.imagery)) {
        const tsBImg = tsB.imagery[tsAImg.id];
        const imagery = imageSet.get(tsAImg.id)!;
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

    for (const tsBImg of Object.values(tsB.imagery)) {
        const tsAImg = tsA.imagery[tsBImg.id];
        const imagery = imageSet.get(tsBImg.id)!;

        if (tsAImg == null) {
            const lineA = TileSetTable.line({ rule: tsBImg, imagery });
            output += c.red('\t-' + lineA) + '\n';
        }
    }
    return output;
}

/**
 * Invalidate the cloudfront distribution cache when updating imagery sets
 */
export function invalidateXYZCache(
    name: string,
    projection: Epsg,
    tag: TileMetadataTag,
    commit = false,
): Promise<void> {
    const nameStr = tag == TileMetadataTag.Production ? name : `${name}@${tag}`;
    const path = `/v1/tiles/${nameStr}/${projection.code}/*`;

    return invalidateCache(path, commit);
}
