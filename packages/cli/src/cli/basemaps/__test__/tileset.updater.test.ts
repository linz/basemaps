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

        let records: any;

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

        o.beforeEach(() => {
            records = {
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
        });

        o('no change', async () => {
            metadata.TileSet = { ...TileSet };
            const updater = new TileSetUpdater(config, TileMetadataNamedTag.Production);

            const changes = await updater.reconcile(false);
            o(changes).deepEquals({ changes: null, imagery: changes.imagery });
            o(changes.imagery.size).equals(0);
        });

        o('tag only', async () => {
            const tag = o.spy();
            const create = o.spy((rec: any): any => ({ ...rec, id: 'new_id', version: 25 }));
            metadata.TileSet = { ...TileSet, create, tag, initialRecord: origTileMetadata.TileSet.initialRecord };

            const updater = new TileSetUpdater(config, 'pr-1');

            const changes = await updater.reconcile(false);
            o(changes).deepEquals({ changes: null, imagery: changes.imagery });
            o(changes.imagery.size).equals(0);

            o(create.callCount).equals(0);
            o(tag.callCount).equals(1);

            o(tag.args).deepEquals(['aerial', Epsg.Google, 'pr-1', 20]);
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

        o('set config', async () => {
            records.head.background = { r: 123, g: 132, b: 142, alpha: 100 };
            records.head.title = 'the title';
            records.head.description = 'the desc';

            const tag = o.spy();
            const create = o.spy((rec: any): any => ({ ...rec, id: 'new_id', version: 25 }));
            metadata.TileSet = { ...TileSet, create, tag, initialRecord: origTileMetadata.TileSet.initialRecord };
            const updater = new TileSetUpdater({ ...config, description: 'change desc' }, 'pr-123');

            const { changes } = await updater.reconcile(true);

            o(create.callCount).equals(1);
            o(tag.callCount).equals(1);

            o(create.args[0]).deepEquals({ ...changes!.after, version: 20, id: 'ts_abc123_head' });

            o(changes!.before.background).deepEquals({ r: 123, g: 132, b: 142, alpha: 100 });
            o(changes!.after.background).deepEquals({ r: 225, g: 226, b: 227, alpha: 228 });
            o(changes!.after.title).equals('the title');
            o(changes!.after.description).equals('change desc');
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
            o(tag.callCount).equals(1);

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
