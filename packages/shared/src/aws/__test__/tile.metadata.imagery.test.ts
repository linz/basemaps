import { compareImageSets } from '../tile.metadata.imagery';
import o from 'ospec';
import { TileSetRuleImagery } from '../tile.metadata.base';

o.spec('TileMetadataImagery', () => {
    o.spec('compareImageSets', () => {
        const getIds = (c: TileSetRuleImagery): string => c.rule.id;
        function rule(id: string, year: number, resolution: number, priority: number): TileSetRuleImagery {
            return { rule: { id, priority }, imagery: { id, year, resolution } } as any;
        }
        o('should fall back to name', () => {
            const imagery = [rule('a', 2018, 1, 100), rule('c', 2018, 1, 100), rule('b', 2018, 1, 100)];
            imagery.sort(compareImageSets);
            o(imagery.map(getIds)).deepEquals(['a', 'b', 'c']);
        });

        o('should sort by resolution', () => {
            const imagery = [rule('a', 2018, 1, 100), rule('b', 2018, 10, 100), rule('c', 2018, 100, 100)];
            imagery.sort(compareImageSets);
            o(imagery.map(getIds)).deepEquals(['c', 'b', 'a']);
        });

        o('should sort by year', () => {
            const imagery = [rule('a', 2019, 1, 1), rule('b', 2017, 10, 1), rule('c', 2018, 1, 1)];
            imagery.sort(compareImageSets);
            o(imagery.map(getIds)).deepEquals(['b', 'c', 'a']);
        });

        o('should sort by priority', () => {
            const imagery = [rule('a', 2018, 1, 50), rule('b', 2018, 1, 1), rule('c', 2019, 1, 100)];
            imagery.sort(compareImageSets);
            o(imagery.map(getIds)).deepEquals(['b', 'a', 'c']);
        });
    });
});
