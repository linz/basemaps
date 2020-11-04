import o from 'ospec';
import { BaseDynamoTable } from '../aws.dynamo.table';
import { TileMetadataTable } from '../tile.metadata';
import { TileMetadataImageryRecord } from '../tile.metadata.base';
import { compareImageSets } from '../tile.metadata.imagery';

o.spec('TileMetadataImagery', () => {
    o.spec('compareImageSets', () => {
        const getIds = (c: TileMetadataImageryRecord): string => c.id;
        function createImagery(id: string, year: number, resolution: number): TileMetadataImageryRecord {
            return { id, year, resolution } as any;
        }
        o('should fall back to name', () => {
            const imagery = [createImagery('a', 2018, 1), createImagery('c', 2018, 1), createImagery('b', 2018, 1)];
            imagery.sort(compareImageSets);
            o(imagery.map(getIds)).deepEquals(['a', 'b', 'c']);
        });

        o('should sort by resolution', () => {
            const imagery = [createImagery('a', 2018, 1), createImagery('b', 2018, 10), createImagery('c', 2018, 100)];
            imagery.sort(compareImageSets);
            o(imagery.map(getIds)).deepEquals(['c', 'b', 'a']);
        });

        o('should sort by year', () => {
            const imagery = [createImagery('a', 2019, 1), createImagery('b', 2017, 10), createImagery('c', 2018, 1)];
            imagery.sort(compareImageSets);
            o(imagery.map(getIds)).deepEquals(['b', 'c', 'a']);
        });
    });

    o('recordIsImagery', () => {
        const table = new TileMetadataTable();

        const item: BaseDynamoTable = { id: 'im_foo', name: 'abc' } as any;

        o(table.Imagery.recordIsImagery(item)).equals(true);
        o(table.Imagery.recordIsImagery({ id: 'ts_foo' } as any)).equals(false);
        if (table.Imagery.recordIsImagery(item)) {
            o(item.name).equals('abc'); // tests compiler
        }
    });
});
