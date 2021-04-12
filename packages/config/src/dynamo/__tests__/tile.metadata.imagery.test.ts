import o from 'ospec';

import { BaseConfig } from '../../config/base';
import { ConfigImagery } from '../../config/imagery';
import { ConfigDynamo } from '../dynamo.config';

o.spec('TileMetadataImagery', () => {
    const table = new ConfigDynamo('Foo');

    o.spec('compareImageSets', () => {
        const getIds = (c: BaseConfig): string => c.id;
        function createImagery(id: string, year: number, resolution: number): ConfigImagery {
            return { id, year, resolution } as any;
        }
        o('should fall back to name', () => {
            const imagery = [createImagery('a', 2018, 1), createImagery('c', 2018, 1), createImagery('b', 2018, 1)];
            imagery.sort(table.TileSet.compareImageSets);
            o(imagery.map(getIds)).deepEquals(['a', 'b', 'c']);
        });

        o('should sort by resolution', () => {
            const imagery = [createImagery('a', 2018, 1), createImagery('b', 2018, 10), createImagery('c', 2018, 100)];
            imagery.sort(table.TileSet.compareImageSets);
            o(imagery.map(getIds)).deepEquals(['c', 'b', 'a']);
        });

        o('should sort by year', () => {
            const imagery = [createImagery('a', 2019, 1), createImagery('b', 2017, 10), createImagery('c', 2018, 1)];
            imagery.sort(table.TileSet.compareImageSets);
            o(imagery.map(getIds)).deepEquals(['b', 'c', 'a']);
        });
    });

    o('recordIsImagery', () => {
        const item: ConfigImagery = { id: 'im_foo', name: 'abc' } as any;

        o(table.Imagery.is(item)).equals(true);
        o(table.Imagery.is({ id: 'ts_foo' } as any)).equals(false);
        if (table.Imagery.is(item)) {
            o(item.name).equals('abc'); // tests compiler
        }
    });
});
