import { Bounds, Epsg } from '@basemaps/geo';
import { qkToNamedBounds } from '@basemaps/shared/build/proj/__test__/test.util';
import o from 'ospec';
import { BaseConfig } from '../../config/base';
import { ConfigImagery } from '../../config/imagery';
import { ConfigImageryRule, ConfigTileSetRaster } from '../../config/tile.set';
import { ConfigDynamo } from '../dynamo.config';

function* genRules(max: number): Generator<ConfigImageryRule> {
    let num = 0;
    while (num < max) yield { ruleId: `ru_` + num, imgId: 'im_' + num++, maxZoom: 0, minZoom: 0, priority: num };
}

o.spec('TileMetadataImagery', () => {
    const config = new ConfigDynamo('Foo');

    o.spec('compareImageSets', () => {
        const getIds = (c: BaseConfig): string => c.id;
        function createImagery(id: string, year: number, resolution: number): ConfigImagery {
            return { id, year, resolution } as any;
        }
        o('should fall back to name', () => {
            const imagery = [createImagery('a', 2018, 1), createImagery('c', 2018, 1), createImagery('b', 2018, 1)];
            imagery.sort(config.TileSet.compareImageSets);
            o(imagery.map(getIds)).deepEquals(['a', 'b', 'c']);
        });

        o('should sort by resolution', () => {
            const imagery = [createImagery('a', 2018, 1), createImagery('b', 2018, 10), createImagery('c', 2018, 100)];
            imagery.sort(config.TileSet.compareImageSets);
            o(imagery.map(getIds)).deepEquals(['c', 'b', 'a']);
        });

        o('should sort by year', () => {
            const imagery = [createImagery('a', 2019, 1), createImagery('b', 2017, 10), createImagery('c', 2018, 1)];
            imagery.sort(config.TileSet.compareImageSets);
            o(imagery.map(getIds)).deepEquals(['b', 'c', 'a']);
        });
    });

    o('is', () => {
        const item: ConfigImagery = { id: 'im_foo', name: 'abc' } as any;

        o(config.Imagery.is(item)).equals(true);
        o(config.Imagery.is({ id: 'ts_foo' } as any)).equals(false);
        if (config.Imagery.is(item)) {
            o(item.name).equals('abc'); // tests compiler
        }
    });

    o('should sort imagery', async () => {
        const rules = Array.from(genRules(2));
        const files = qkToNamedBounds(['313']);
        const imagery = rules.map((r) => ({
            v: 1,
            id: r.imgId,
            projection: Epsg.Google.code,
            year: 2001,
            resolution: 100,
            bounds: Bounds.union(files).toJson(),
            files,
        })) as ConfigImagery[];
        for (const i of imagery) config.Imagery.cache.set(i.id, i);
        const tsData = {
            createdAt: 0,
            updatedAt: 0,
            id: 'ts_aerial_3857',
            version: 0,
            rules,
            name: 'aerial',
            projection: Epsg.Google.code,
        } as ConfigTileSetRaster;

        const getAll = (): string[] => tsData.rules.map((c) => c.imgId);
        o(getAll()).deepEquals(['im_0', 'im_1']);

        rules[0].priority = rules[1].priority;
        config.TileSet.sortRenderRules(tsData, config.Imagery.cache);
        o(getAll()).deepEquals(['im_0', 'im_1']);

        imagery[0].year = 2020;
        config.TileSet.sortRenderRules(tsData, config.Imagery.cache);
        o(getAll()).deepEquals(['im_1', 'im_0']);

        imagery[1].year = 2020;
        imagery[1].resolution = 3000;
        config.TileSet.sortRenderRules(tsData, config.Imagery.cache);
        o(getAll()).deepEquals(['im_1', 'im_0']);
    });
});
