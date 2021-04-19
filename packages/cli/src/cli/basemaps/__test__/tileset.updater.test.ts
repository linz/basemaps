// import { Epsg, EpsgCode } from '@basemaps/geo';
// import { Config } from '@basemaps/shared';
// import o from 'ospec';
// import { ProjectionConfig } from '../tileset.config';
// import { TileSetUpdater } from '../tileset.updater';
// import { parseRgba } from '../tileset.util';
// import sinon from 'sinon';
// import { ConfigImageryRule, ConfigTag, ConfigTileSetRaster } from '@basemaps/config';

// o.spec('TileSetUpdater', () => {
//     const sandbox = sinon.createSandbox();
//     o.afterEach(() => sandbox.restore());

//     o.spec('new', () => {
//         o('throw on bad config', () => {
//             try {
//                 new TileSetUpdater({}, Config.Tag.Head);
//                 o('did not throw').equals('throw');
//             } catch (err) {
//                 o(err.errors.length).notEquals(0);
//             }
//         });
//     });

//     o.spec('reconcile', () => {
//         const background = 'e1e2e3e4';
//         const tileSet1 = {
//             id: 'abc123',
//             name: 'tileset_1_2019-2020_0.05m',
//             priority: 2000,
//             minZoom: 13,
//             maxZoom: 32,
//         };
//         const config: ProjectionConfig = {
//             name: 'aerial',
//             projection: EpsgCode.Google,
//             background: background,
//             imagery: [tileSet1],
//         };

//         const rec1: ConfigImageryRule = {
//             imgId: 'im_abc123',
//             ruleId: 'ir_abc1231',
//             priority: 2000,
//             minZoom: 13,
//             maxZoom: 32,
//         };

//         const RecordHead = {
//             id: 'ts_aerial_3857_head',
//             v: 2,
//             version: 20,
//             background: parseRgba(background),
//             projection: EpsgCode.Google,
//             rules: [rec1],
//         };
//         const RecordProduction = {
//             id: 'ts_aerial_3857_production',
//             v: 2,
//             version: 20,
//             background: parseRgba(background),
//             projection: EpsgCode.Google,
//             rules: [rec1],
//         };

//         const Records = [RecordHead, RecordProduction] as Partial<ConfigTileSetRaster>[];

//         o.beforeEach(() => {
//             sandbox
//                 .stub(Config.TileSet, 'get')
//                 .callsFake(async (key) => Object.values(Records).find((f) => f.id === key) as ConfigTileSetRaster);
//             sandbox.stub(Config.Imagery, 'getAll').callsFake(async () => new Map());
//         });

//         o('no change', async () => {
//             const updater = new TileSetUpdater(config, Config.Tag.Production);
//             const changes = await updater.reconcile(false);
//             o(changes).deepEquals({ changes: null, imagery: changes.imagery });
//             o(changes.imagery.size).equals(0);
//         });

//         o.only('should tag when no changes', async () => {
//             const tag = sandbox.stub(Config.TileSet, 'tag');
//             const create = sandbox
//                 .stub(Config.TileSet, 'create')
//                 .callsFake((rec: any) => ({ ...rec, id: 'new_id', version: 25 }));
//             // const tag = o.spy();
//             // const create = o.spy((rec: any): any => ({ ...rec, id: 'new_id', version: 25 }));

//             const updater = new TileSetUpdater(config, 'pr-1' as ConfigTag);

//             const changes = await updater.reconcile(false);
//             o(changes).deepEquals({ changes: null, imagery: changes.imagery });
//             o(changes.imagery.size).equals(0);

//             // o(create.callCount).equals(0);
//             o(tag.callCount).equals(1);

//             console.log(tag.getCall(0).args);
//             // o(tag.getCall(0).args[1]).deepEquals(['aerial', Epsg.Google, 'pr-1', 20]);
//         });

//         o('tagging production not head', async () => {
//             RecordHead.version = 24;
//             RecordHead.rules[0] = { ...rec1, minZoom: 12 };
//             RecordProduction.rules[0] = { ...rec1, minZoom: 14 };

//             const tag = o.spy();
//             const create = o.spy((rec: any): any => ({ ...rec, id: 'new_id', version: 25 }));
//             // metadata.TileSet = { ...TileSet, create, tag };
//             const updater = new TileSetUpdater(config, Config.Tag.Production);

//             const changes = await updater.reconcile(true);

//             o(create.callCount).equals(1);
//             o(tag.callCount).equals(1);

//             o(tag.args).deepEquals(['aerial', Epsg.Google, Config.Tag.Production, 25]);

//             o(changes.changes!.after.rules).deepEquals([
//                 {
//                     imgId: 'im_abc123',
//                     ruleId: 'ir_abc1231',
//                     priority: 2000,
//                     minZoom: 13,
//                     maxZoom: 32,
//                 },
//             ]);
//         });

//         o('tagging production is head', async () => {
//             RecordHead.version = 24;
//             RecordHead.rules[0] = { ...rec1, minZoom: 14 };
//             RecordProduction.version = 24;
//             RecordProduction.rules[0] = { ...rec1, minZoom: 14 };

//             const tag = o.spy();
//             const create = o.spy((rec: any): any => ({ ...rec, id: 'new_id', version: 25 }));
//             // metadata.TileSet = { ...TileSet, create, tag };
//             const updater = new TileSetUpdater(config, Config.Tag.Production);

//             const changes = await updater.reconcile(true);

//             o(create.callCount).equals(1);
//             o(tag.callCount).equals(1);

//             o(tag.args).deepEquals(['aerial', Epsg.Google, Config.Tag.Production, 25]);

//             o(changes.changes!.after.rules).deepEquals([
//                 {
//                     imgId: 'im_abc123',
//                     ruleId: 'ir_abc1231',
//                     priority: 2000,
//                     minZoom: 13,
//                     maxZoom: 32,
//                 },
//             ]);
//         });

//         o('tag new pr', async () => {
//             RecordHead.version = 24;
//             RecordHead.rules[0] = { ...rec1, minZoom: 14 };

//             const tag = o.spy();
//             const create = o.spy((rec: any): any => ({ ...rec, id: 'new_id', version: 25 }));
//             // metadata.TileSet = {
//             //     ...TileSet,
//             //     create,
//             //     tag,
//             //     initialRecordRaster: origTileMetadata.TileSet.initialRecordRaster,
//             // };
//             const updater = new TileSetUpdater(config, 'pr-123' as ConfigTag);

//             const changes = await updater.reconcile(true);

//             o(create.callCount).equals(1);
//             o(tag.callCount).equals(1);

//             o(changes.changes!.after.rules).deepEquals([
//                 {
//                     imgId: 'im_abc123',
//                     ruleId: 'ir_abc1231',
//                     priority: 2000,
//                     minZoom: 13,
//                     maxZoom: 32,
//                 },
//             ]);
//         });
//     });
// });
