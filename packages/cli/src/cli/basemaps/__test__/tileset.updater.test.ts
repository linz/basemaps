import { Epsg, EpsgCode } from '@basemaps/geo';
import { Aws, TileMetadataImageRule, TileMetadataNamedTag, TileMetadataTag } from '@basemaps/shared';
import o from 'ospec';
import { ProjectionConfig } from '../tileset.config';
import { TileSetUpdater } from '../tileset.updater';
import { parseRgba } from '../tileset.util';

o.spec('tileset.updater', () => {
    o.spec('new', () => {
        o('bad config', () => {
            try {
                new TileSetUpdater({}, TileMetadataNamedTag.Head);
                o('did not throw').equals('throw');
            } catch (err) {
                o(err.errors.length).notEquals(0);
            }
        });
    });

    o.spec('reconcile', () => {
        const origTileMetadata = Aws.tileMetadata;
        const background = 'e1e2e3e4';
        const tileSet1 = {
            id: 'abc123',
            name: 'tileset_1_2019-2020_0.05m',
            priority: 2000,
            minZoom: 13,
            maxZoom: 32,
        };
        const config: ProjectionConfig = {
            name: 'aerial',
            projection: EpsgCode.Google,
            background: background,
            imagery: [tileSet1],
        };

        const metadata = {
            batchGet: () => new Map(),
        } as any;

        const rec1: TileMetadataImageRule = {
            imgId: 'im_abc123',
            ruleId: 'ir_abc1231',
            priority: 2000,
            minZoom: 13,
            maxZoom: 32,
        };

        const origRecords = {
            head: {
                id: 'ts_abc123_head',
                v: 2,
                version: 20,
                background: parseRgba(background),
                projection: EpsgCode.Google,
                rules: [rec1],
            },
            production: {
                id: 'ts_abc123_production',
                v: 2,
                version: 20,
                background: parseRgba(background),
                projection: EpsgCode.Google,
                rules: [rec1],
            },
        };

        let records = { ...origRecords };

        const TileSet = {
            get: (name: string, proj: Epsg, tag: TileMetadataTag): any => {
                if (name !== 'aerial' || proj !== Epsg.Google) {
                    throw new Error('invalid args!');
                }
                return (records as any)[tag];
            },
        };

        o.before(() => {
            Aws.tileMetadata = metadata;
        });

        o.after(() => {
            Aws.tileMetadata = origTileMetadata;
        });

        o.afterEach(() => {
            records = { ...origRecords };
        });

        o('no change', async () => {
            metadata.TileSet = { ...TileSet };
            const updater = new TileSetUpdater(config, TileMetadataNamedTag.Production);

            const changes = await updater.reconcile(false);
            o(changes).deepEquals({ changes: null, imagery: changes.imagery });
            o(changes.imagery.size).equals(0);
        });

        o('tagging production not head', async () => {
            records.head.version = 24;
            records.head.rules[0] = { ...rec1, minZoom: 12 };
            records.production.rules[0] = { ...rec1, minZoom: 14 };

            const tag = o.spy();
            const create = o.spy((rec: any): any => ({ ...rec, id: 'new_id', version: 25 }));
            metadata.TileSet = { ...TileSet, create, tag };
            const updater = new TileSetUpdater(config, TileMetadataNamedTag.Production);

            const changes = await updater.reconcile(true);

            o(create.callCount).equals(1);
            o(tag.callCount).equals(1);

            o(tag.args).deepEquals(['aerial', Epsg.Google, TileMetadataNamedTag.Production, 25]);

            o(changes.changes!.after.rules).deepEquals([
                {
                    imgId: 'im_abc123',
                    ruleId: 'ir_abc1231',
                    priority: 2000,
                    minZoom: 13,
                    maxZoom: 32,
                },
            ]);
        });

        o('tagging production is head', async () => {
            records.head.version = 24;
            records.head.rules[0] = { ...rec1, minZoom: 14 };
            records.production.version = 24;
            records.production.rules[0] = { ...rec1, minZoom: 14 };

            const tag = o.spy();
            const create = o.spy((rec: any): any => ({ ...rec, id: 'new_id', version: 25 }));
            metadata.TileSet = { ...TileSet, create, tag };
            const updater = new TileSetUpdater(config, TileMetadataNamedTag.Production);

            const changes = await updater.reconcile(true);

            o(create.callCount).equals(1);
            o(tag.callCount).equals(1);

            o(tag.args).deepEquals(['aerial', Epsg.Google, TileMetadataNamedTag.Production, 25]);

            o(changes.changes!.after.rules).deepEquals([
                {
                    imgId: 'im_abc123',
                    ruleId: 'ir_abc1231',
                    priority: 2000,
                    minZoom: 13,
                    maxZoom: 32,
                },
            ]);
        });

        o('tag new pr', async () => {
            records.head.version = 24;
            records.head.rules[0] = { ...rec1, minZoom: 14 };

            const tag = o.spy();
            const create = o.spy((rec: any): any => ({ ...rec, id: 'new_id', version: 25 }));
            metadata.TileSet = { ...TileSet, create, tag, initialRecord: origTileMetadata.TileSet.initialRecord };
            const updater = new TileSetUpdater(config, 'pr-123');

            const changes = await updater.reconcile(true);

            o(create.callCount).equals(1);
            o(tag.callCount).equals(0);

            o(changes.changes!.after.rules).deepEquals([
                {
                    imgId: 'im_abc123',
                    ruleId: 'ir_abc1231',
                    priority: 2000,
                    minZoom: 13,
                    maxZoom: 32,
                },
            ]);
        });
    });
});
