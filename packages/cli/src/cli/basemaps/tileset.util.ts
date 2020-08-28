import { Epsg } from '@basemaps/geo';
import {
    Aws,
    TileMetadataImageRule,
    TileMetadataImageryRecord,
    TileMetadataSetRecord,
    TileMetadataTag,
} from '@basemaps/shared';
import * as c from 'ansi-colors';
import { CliTable } from '../cli.table';
import { invalidateCache } from '../util';

interface TileSetRuleImagery {
    rule: TileMetadataImageRule;
    imagery: TileMetadataImageryRecord;
}

export const TileSetTable = new CliTable<TileSetRuleImagery>();
TileSetTable.field('#', 4, (obj) => String(obj.rule.priority));
TileSetTable.field('Rule Id', 30, (obj) => c.dim(obj.rule.ruleId));
TileSetTable.field('Imagery Id', 30, (obj) => c.dim(obj.rule.imgId));
TileSetTable.field('Name', 40, (obj) => obj.imagery.name);
TileSetTable.field('Zoom', 10, (obj) => obj.rule.minZoom + ' -> ' + obj.rule.maxZoom);
TileSetTable.field('CreatedAt', 10, (obj) => new Date(obj.imagery.createdAt).toISOString());

export async function printTileSetImagery(tsData: TileMetadataSetRecord): Promise<void> {
    const allImagery = await Aws.tileMetadata.Imagery.getAll(tsData);
    Aws.tileMetadata.TileSet.sortRenderRules(tsData, allImagery);
    console.log('');
    TileSetTable.header();
    TileSetTable.print(
        tsData.rules.map((rule) => {
            const imagery = allImagery.get(rule.imgId);
            if (imagery == null) throw new Error('Unable to find imagery: ' + rule.imgId);
            return { rule, imagery };
        }),
    );
}

export async function printTileSet(tsData: TileMetadataSetRecord, printImagery = true): Promise<void> {
    console.log(c.bold('TileSet:'), `${tsData.name} `);
    console.log(c.bold('CreatedAt:'), new Date(tsData.createdAt).toISOString());
    console.log(c.bold('UpdatedAt:'), new Date(tsData.updatedAt).toISOString());
    console.log(c.bold('Version:'), `v${tsData.version}`);
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

    if (printImagery) await printTileSetImagery(tsData);
}

export function showDiff(
    tsA: TileMetadataSetRecord,
    tsB: TileMetadataSetRecord,
    imageSet: Map<string, TileMetadataImageryRecord>,
): string {
    let output = '';
    for (const tsAImg of tsA.rules) {
        const tsBImg = tsB.rules.find((rule) => rule.ruleId == tsAImg.ruleId);
        const imagery = imageSet.get(tsAImg.imgId)!;
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

    for (const tsBImg of tsB.rules) {
        const tsAImg = tsA.rules.find((rule) => rule.ruleId == tsBImg.ruleId);
        const imagery = imageSet.get(tsBImg.imgId)!;

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
    const path = `/v1/tiles/${nameStr}/${projection.toEpsgString()}/*`;

    return invalidateCache(path, commit);
}
