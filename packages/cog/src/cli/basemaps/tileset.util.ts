import { Aws, TileMetadataImageRule, TileMetadataImageryRecord, TileMetadataSetRecord } from '@basemaps/lambda-shared';
import * as c from 'chalk';
import { CliTable } from '../cli.table';

export const TileSetTable = new CliTable<{ rule: TileMetadataImageRule; img: TileMetadataImageryRecord }>();
TileSetTable.field('#', 4, (obj) => String(obj.rule.priority));
TileSetTable.field('Id', 30, (obj) => c.dim(obj.rule.id));
TileSetTable.field('Name', 40, (obj) => obj.img.name);
TileSetTable.field('Zoom', 10, (obj) => obj.rule.minZoom + ' -> ' + obj.rule.maxZoom);

export async function printTileSetImagery(tsData: TileMetadataSetRecord): Promise<void> {
    const imagery = await Aws.tileMetadata.Imagery.getAll(tsData);
    console.log(c.bold('Imagery:'));
    TileSetTable.header();
    const fields = Aws.tileMetadata.TileSet.rules(tsData).map((rule) => {
        return { rule, img: imagery.get(rule.id)! };
    });
    TileSetTable.print(fields);
}

export async function printTileSet(tsData: TileMetadataSetRecord, printImagery = true): Promise<void> {
    console.log(c.bold('TileSet:'), `${tsData.name} `);
    console.log(c.bold('CreatedAt:'), new Date(tsData.createdAt).toString());
    console.log(c.bold('UpdatedAt:'), new Date(tsData.updatedAt).toString());
    console.log(c.bold('Version:'), `v${tsData.version}`);

    if (printImagery) await printTileSetImagery(tsData);
}
