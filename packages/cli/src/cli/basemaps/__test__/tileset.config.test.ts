import o from 'ospec';
import { addDefaults, assertTileSetConfig, ImageryDefaultConfig, removeDefaults } from '../tileset.config';

o.spec('imagery.config', () => {
    const image1 = {
        id: 'abc123',
        name: 'tileset_1_2019-2020_0.05m',
        priority: 2000,
        minZoom: 13,
        maxZoom: 32,
    };

    const tileset3857 = {
        name: 'aerial',
        projection: 3857,
        background: '000000ff',
        imagery: [image1],
    };

    o.spec('addDefaults', () => {
        o('no defaults', () => {
            o(
                addDefaults([], {
                    id: '01ED81CFNWK9R75S0277SW972N',
                    name: 'auckland_urban_2015-16_0-075m',
                }),
            ).deepEquals({
                id: '01ED81CFNWK9R75S0277SW972N',
                name: 'auckland_urban_2015-16_0-075m',
                priority: 1000,
                minZoom: 0,
                maxZoom: 32,
            });
        });

        o('invalid result', () => {
            try {
                addDefaults([{ minZoom: 12 }], {
                    id: '01ED81CFNWK9R75S0277SW972N',
                    name: 'auckland_urban_2015-16_0-075m',
                    maxZoom: 10,
                });
                o('should throw').equals('did not throw');
            } catch (err) {
                const err0 = err.errors[0];
                o(err0.code).equals('custom_error');
                o(err0.path).deepEquals(['minZoom']);
                o(err0.message).equals('minZoom may no be greater than maxZoom');
            }
        });

        o('no condition', () => {
            const defaults: ImageryDefaultConfig[] = [
                {
                    priority: 3000,
                    minZoom: 14,
                    maxZoom: 32,
                },
            ];
            o(
                addDefaults(defaults, {
                    id: '01ED81CFNWK9R75S0277SW972N',
                    name: 'auckland_urban_2015-16_0-075m',
                }),
            ).deepEquals({
                id: '01ED81CFNWK9R75S0277SW972N',
                name: 'auckland_urban_2015-16_0-075m',
                priority: 3000,
                minZoom: 14,
                maxZoom: 32,
            });
        });

        o('nameContains', () => {
            const defaults: ImageryDefaultConfig[] = [
                { nameContains: '_rural_', priority: 2000, minZoom: 11 },
                { nameContains: '_urban_', minZoom: 12 },
                {
                    minZoom: 1,
                    maxZoom: 30,
                },
            ];
            o(
                addDefaults(defaults, {
                    id: '01ED81CFNWK9R75S0277SW972N',
                    name: 'auckland_urban_2015-16_0-075m',
                }),
            ).deepEquals({
                id: '01ED81CFNWK9R75S0277SW972N',
                name: 'auckland_urban_2015-16_0-075m',
                priority: 1000,
                minZoom: 12,
                maxZoom: 30,
            });
        });
    });

    o.spec('removeDefaults', () => {
        o('no defaults', () => {
            o(
                removeDefaults([], {
                    id: '01ED81CFNWK9R75S0277SW972N',
                    name: 'auckland_urban_2015-16_0-075m',
                    priority: 1000,
                    minZoom: 0,
                    maxZoom: 32,
                }),
            ).deepEquals({
                id: '01ED81CFNWK9R75S0277SW972N',
                name: 'auckland_urban_2015-16_0-075m',
                priority: 1000,
                minZoom: 0,
                maxZoom: 32,
            });
        });

        o('no condition', () => {
            const defaults: ImageryDefaultConfig[] = [
                {
                    priority: 3000,
                    minZoom: 14,
                    maxZoom: 32,
                },
            ];
            o(
                removeDefaults(defaults, {
                    id: '01ED81CFNWK9R75S0277SW972N',
                    name: 'auckland_urban_2015-16_0-075m',
                    priority: 3000,
                    minZoom: 14,
                    maxZoom: 32,
                }),
            ).deepEquals({
                id: '01ED81CFNWK9R75S0277SW972N',
                name: 'auckland_urban_2015-16_0-075m',
            });
        });

        o('nameContains', () => {
            const defaults: ImageryDefaultConfig[] = [
                { nameContains: '_rural_', priority: 2000, minZoom: 11 },
                { nameContains: '_urban_', minZoom: 12 },
                {
                    minZoom: 1,
                    maxZoom: 30,
                },
            ];
            o(
                removeDefaults(defaults, {
                    id: '01ED81CFNWK9R75S0277SW972N',
                    name: 'auckland_urban_2015-16_0-075m',
                    priority: 1000,
                    minZoom: 12,
                    maxZoom: 30,
                }),
            ).deepEquals({
                id: '01ED81CFNWK9R75S0277SW972N',
                name: 'auckland_urban_2015-16_0-075m',
                priority: 1000,
            });
        });
    });

    o.spec('assertValid', () => {
        o('empty', () => {
            const x = { name: 'aerial', projection: 3857, background: '11223344', imagery: [] } as unknown;
            assertTileSetConfig(x);

            o(x.imagery).deepEquals([]);
        });

        o('full', () => {
            const x = { ...tileset3857 } as unknown;
            assertTileSetConfig(x);
        });

        o('invalid schema', () => {
            try {
                assertTileSetConfig({ name: [] });
                o('no throw').equals('throw');
            } catch (err) {
                o(err.errors[0].code).equals('invalid_type');
            }
        });

        o('invalid priority', () => {
            const badTileset = { ...tileset3857, imagery: [{ ...image1, priority: -2 }] };
            try {
                assertTileSetConfig(badTileset);
                o('no throw').equals('throw');
            } catch (err) {
                const err0 = err.errors[0];
                o(err0.code).equals('custom_error');
                o(err0.path).deepEquals(['imagery', 0, 'priority']);
                o(err0.message).equals('must be between -1 and 10000');
            }
        });

        o('invalid zoom', () => {
            const badTileset = { ...tileset3857, imagery: [{ ...image1, minZoom: 5, maxZoom: -1 }] };
            try {
                assertTileSetConfig(badTileset);
                o('no throw').equals('throw');
            } catch (err) {
                o(err.errors[0].message).equals('must be between 0 and 32');
                const err1 = err.errors[1];
                o(err1.code).equals('custom_error');
                o(err1.path).deepEquals(['imagery', 0, 'minZoom']);
                o(err1.message).equals('minZoom may no be greater than maxZoom');
            }
        });

        o('invalid background', () => {
            const badTileset = { ...tileset3857, background: '112233yy' };
            try {
                assertTileSetConfig(badTileset);
                o('no throw').equals('throw');
            } catch (err) {
                const err0 = err.errors[0];
                o(err0.code).equals('custom_error');
                o(err0.path).deepEquals(['background']);
                o(err0.message).equals('Invalid hex color');
            }
        });
    });
});
