import { CliTable } from '../cli.table';
import { TileMetadataImageRule, TileMetadataImageryRecord, TileMetadataSetRecord, Aws } from '@basemaps/lambda-shared';
import * as c from 'chalk';

const TileSetTable = new CliTable<{ rule: TileMetadataImageRule; img: TileMetadataImageryRecord }>();
TileSetTable.field('#', 4, (obj, index) => String(index + 1));
TileSetTable.field('Id', 30, (obj) => c.dim(obj.rule.id));
TileSetTable.field('Name', 40, (obj) => obj.img.name);
TileSetTable.field('Zoom', 10, (obj) => obj.rule.minZoom + ' -> ' + obj.rule.maxZoom);

export async function printTileSet(tsData: TileMetadataSetRecord): Promise<void> {
    const imagery = await Aws.tileMetadata.db.getAllImagery(tsData);

    console.log(c.bold('TileSet:'), tsData.name);
    console.log(c.bold('CreatedAt:'), new Date(tsData.createdAt).toString());
    console.log(c.bold('UpdatedAt:'), new Date(tsData.updatedAt).toString());
    console.log(c.bold('Imagery:'));

    TileSetTable.header();
    const fields = tsData.imagery.map((rule) => {
        return { rule, img: imagery.get(rule.id)! };
    });
    TileSetTable.print(fields);
}
