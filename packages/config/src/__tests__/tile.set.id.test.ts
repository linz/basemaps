import o from 'ospec';
import { ConfigTag } from '../config/tag';
import { TileSetNameParser } from '../tile.set.name';

o.spec('parse', () => {
    o('should parse @ syntax', () => {
        o(TileSetNameParser.parse('aerial@head')).deepEquals({
            name: 'aerial',
            tag: ConfigTag.Head,
        });
        o(TileSetNameParser.parse('aerial@production')).deepEquals({
            name: 'aerial',
            tag: ConfigTag.Production,
        });
        o(TileSetNameParser.parse('aerial@beta')).deepEquals({
            name: 'aerial',
            tag: ConfigTag.Beta,
        });
        o(TileSetNameParser.parse('aerial@pr-123')).deepEquals({ name: 'aerial', tag: 'pr-123' as ConfigTag });
    });

    o('should parse layer syntax', () => {
        o(TileSetNameParser.parse('aerial@head:layer')).deepEquals({
            name: 'aerial',
            tag: ConfigTag.Head,
            layer: 'layer',
        });
        o(TileSetNameParser.parse('aerial:layer')).deepEquals({
            name: 'aerial',
            tag: ConfigTag.Production,
            layer: 'layer',
        });
    });

    o('should throw with invalid tags', () => {
        o(TileSetNameParser.parse('aerial@foo')).deepEquals({
            name: 'aerial@foo',
            tag: ConfigTag.Production,
        });
        o(TileSetNameParser.parse('AeRiaL@9FooBar')).deepEquals({
            name: 'AeRiaL@9FooBar',
            tag: ConfigTag.Production,
        });
    });

    o('should be case sensitive', () => {
        o(TileSetNameParser.parse('AeRiaL@BETA')).deepEquals({
            name: 'AeRiaL@BETA',
            tag: ConfigTag.Production,
        });
        o(TileSetNameParser.parse('AeRiaL@HEAD')).deepEquals({
            name: 'AeRiaL@HEAD',
            tag: ConfigTag.Production,
        });
    });

    o('should round trip', () => {
        o(TileSetNameParser.componentsToName(TileSetNameParser.parse('aerial@beta:layer'))).equals('aerial@beta:layer');
        o(TileSetNameParser.componentsToName(TileSetNameParser.parse('aerial@production:layer'))).equals(
            'aerial:layer',
        );
    });
});
