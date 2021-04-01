import o from 'ospec';
import { TileMetadataNamedTag } from '../aws/tile.metadata.base';
import { TileSetName } from '../proj/tile.set.name';
import { TileSetNameParser } from '../tile.set.name';

o.spec('parse', () => {
    o('should parse @ syntax', () => {
        o(TileSetNameParser.parse('aerial@head')).deepEquals({
            name: TileSetName.aerial,
            tag: TileMetadataNamedTag.Head,
        });
        o(TileSetNameParser.parse('aerial@production')).deepEquals({
            name: TileSetName.aerial,
            tag: TileMetadataNamedTag.Production,
        });
        o(TileSetNameParser.parse('aerial@beta')).deepEquals({
            name: TileSetName.aerial,
            tag: TileMetadataNamedTag.Beta,
        });
        o(TileSetNameParser.parse('aerial@pr-123')).deepEquals({ name: TileSetName.aerial, tag: 'pr-123' });
    });

    o('should parse layer syntax', () => {
        o(TileSetNameParser.parse('aerial@head:layer')).deepEquals({
            name: TileSetName.aerial,
            tag: TileMetadataNamedTag.Head,
            layer: 'layer',
        });
        o(TileSetNameParser.parse('aerial:layer')).deepEquals({
            name: TileSetName.aerial,
            tag: TileMetadataNamedTag.Production,
            layer: 'layer',
        });
    });

    o('should throw with invalid tags', () => {
        o(TileSetNameParser.parse('aerial@foo')).deepEquals({
            name: 'aerial@foo',
            tag: TileMetadataNamedTag.Production,
        });
        o(TileSetNameParser.parse('AeRiaL@9FooBar')).deepEquals({
            name: 'AeRiaL@9FooBar',
            tag: TileMetadataNamedTag.Production,
        });
    });

    o('should be case sensitive', () => {
        o(TileSetNameParser.parse('AeRiaL@BETA')).deepEquals({
            name: 'AeRiaL@BETA',
            tag: TileMetadataNamedTag.Production,
        });
        o(TileSetNameParser.parse('AeRiaL@HEAD')).deepEquals({
            name: 'AeRiaL@HEAD',
            tag: TileMetadataNamedTag.Production,
        });
    });

    o('should round trip', () => {
        o(TileSetNameParser.componentsToName(TileSetNameParser.parse('aerial@beta:layer'))).equals('aerial@beta:layer');
        o(TileSetNameParser.componentsToName(TileSetNameParser.parse('aerial@production:layer'))).equals(
            'aerial:layer',
        );
    });
});
