import { EpsgCode } from '@basemaps/geo';
import { Epsg } from '@basemaps/geo';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import o from 'ospec';
import { Const } from '../../const';
import { TileSetName } from '../../proj/tile.set.name';
import { BaseDynamoTable } from '../aws.dynamo.table';
import { TileMetadataTable } from '../tile.metadata';
import { TileMetadataNamedTag, TileMetadataSetRecord } from '../tile.metadata.base';
import { TileMetadataTileSet } from '../tile.metadata.tileset';

const promiseNull = async (): Promise<unknown> => null;
async function throws(cb: () => Promise<any>, re: RegExp): Promise<void> {
    try {
        await cb();
        o(true).equals(false)(`Should have thrown`);
    } catch (e) {
        o(re.test(e)).equals(true)(`${e.message} should match ${re}`);
    }
}

o.spec('tile.metadata.tileset', () => {
    const metadata = {
        put: o.spy<TileMetadataSetRecord[], Promise<any>>(promiseNull) as any,
        get: o.spy<string[], Promise<any>>(promiseNull),
    };
    const ts = new TileMetadataTileSet(metadata as any);

    o.beforeEach(() => {
        metadata.get = o.spy(promiseNull);
        metadata.put = o.spy(promiseNull);
    });

    o.spec('create', () => {
        o('Should create initial tags', async () => {
            await ts.create({ name: 'test', projection: Epsg.Google, imagery: {} } as any);

            o(metadata.get.callCount).equals(1);
            o(metadata.get.args[0]).equals('ts_test_3857_head');
            o(metadata.put.callCount).equals(2);
            o(metadata.put.calls[0].args[0].id).equals('ts_test_3857_v000000');
            o(metadata.put.calls[1].args[0].id).equals('ts_test_3857_head');
        });

        o('should migrate records on creation', async () => {
            const res = await ts.create({
                name: 'test',
                projection: Epsg.Google,
                imagery: { im_0: { id: 'im_0', minZoom: 1, maxZoom: 2, priority: 3 } },
            } as any);

            o(res.v).equals(2);
            o((res as any)['imagery']).equals(undefined);
            o(res.rules.length).equals(1);
            o(res.rules[0].imgId).equals('im_0');
            o(res.rules[0].minZoom).equals(1);
            o(res.rules[0].maxZoom).equals(2);
            o(res.rules[0].priority).equals(3);
        });

        o('should increment version number', async () => {
            metadata.get = o.spy(() => Promise.resolve({ revisions: 5 }));
            const res = await ts.create({ name: 'test', projection: Epsg.Google, imagery: {} } as any);

            o(metadata.get.callCount).equals(1);
            o(metadata.get.args[0]).equals('ts_test_3857_head');
            o(metadata.put.callCount).equals(2);
            o(metadata.put.calls[0].args[0].id).equals('ts_test_3857_v000006');
            o(metadata.put.calls[1].args[0].id).equals('ts_test_3857_head');

            o(res.version).equals(6);
            o(res.revisions).equals(6);

            metadata.get = o.spy(() => Promise.resolve(res));
            const resB = await ts.create({ name: 'test', projection: Epsg.Google, imagery: {} } as any);
            o(res.version).equals(6);
            o(resB.version).equals(7);
            o(resB.revisions).equals(7);
        });
    });

    o.spec('tag', () => {
        o('should fail if version does not exist', async () => {
            await throws(() => ts.tag('test', Epsg.Google, TileMetadataNamedTag.Production, 5), /ts_test_3857_v000005/);
        });

        o('should fail if tagging head', async () => {
            await throws(() => ts.tag('test', Epsg.Google, TileMetadataNamedTag.Head, 5), /Cannot overwrite head tag/);
        });

        o('should create tags', async () => {
            metadata.get = o.spy(() => Promise.resolve({ revisions: 5 }));
            const res = await ts.tag('test', Epsg.Google, TileMetadataNamedTag.Production, 5);
            o(res.id).equals('ts_test_3857_production');
            o(res.v).equals(2);
            o(Array.isArray(res.rules)).equals(true);
            o(metadata.get.callCount).equals(1);
            o(metadata.put.callCount).equals(1);
            o(metadata.put.args[0].id).equals('ts_test_3857_production');
        });
    });

    o.spec('idSplit', () => {
        function fakeRecord(id: string, version: number): TileMetadataSetRecord {
            const rec = ts.initialRecord('rec', EpsgCode.Google);
            rec.id = id;
            rec.version = version;
            return rec;
        }

        o('should return null for unexpected ids', () => {
            o(ts.idSplit(fakeRecord('wrongId', 0))).equals(null);
            o(ts.idSplit(fakeRecord('im_test_3857_head', 2))).equals(null);
            o(ts.idSplit(fakeRecord('ts_test_0000_production', 1))).equals(null);
            o(ts.idSplit(fakeRecord('ts_test_3857_v000006', 7))).equals(null);
        });

        o('should split ids', () => {
            o(ts.idSplit(fakeRecord('ts_test_3857_head', 1))).deepEquals({
                name: 'test',
                projection: Epsg.Google,
                tag: 'head',
                version: 1,
            });
            o(ts.idSplit(fakeRecord('ts_test_2193_pr-12', 2))).deepEquals({
                name: 'test',
                projection: Epsg.Nztm2000,
                tag: 'pr-12',
                version: 2,
            });
            o(ts.idSplit(fakeRecord('ts_test_3857_v000006', 6))).deepEquals({
                name: 'test',
                projection: Epsg.Google,
                tag: 'v000006',
                version: 6,
            });
        });
    });

    o.spec('parse', () => {
        o('should parse @ syntax', () => {
            o(ts.parse('aerial@head')).deepEquals({ name: TileSetName.aerial, tag: TileMetadataNamedTag.Head });
            o(ts.parse('aerial@production')).deepEquals({
                name: TileSetName.aerial,
                tag: TileMetadataNamedTag.Production,
            });
            o(ts.parse('aerial@beta')).deepEquals({ name: TileSetName.aerial, tag: TileMetadataNamedTag.Beta });
            o(ts.parse('aerial@pr-123')).deepEquals({ name: TileSetName.aerial, tag: 'pr-123' });
        });

        o('should throw with invalid tags', () => {
            o(ts.parse('aerial@foo')).deepEquals({ name: 'aerial@foo' });
            o(ts.parse('AeRiaL@9FooBar')).deepEquals({ name: 'AeRiaL@9FooBar' });
        });

        o('should be case sensitive', () => {
            o(ts.parse('AeRiaL@BETA')).deepEquals({ name: 'AeRiaL@BETA' });
            o(ts.parse('AeRiaL@HEAD')).deepEquals({ name: 'AeRiaL@HEAD' });
        });
    });

    o('recordIsTileSet', () => {
        const table = new TileMetadataTable();

        const item: BaseDynamoTable = { id: 'ts_foo', name: 'abc' } as any;

        o(table.TileSet.recordIsTileSet(item)).equals(true);
        o(table.TileSet.recordIsTileSet({ id: 'im_foo' } as any)).equals(false);
        if (table.Imagery.recordIsImagery(item)) {
            o(item.name).equals('abc'); // tests compiler
        }
    });

    o('asyncIterator', async () => {
        const rule = { imgId: 'im_ulid', maxZoom: 1, minZoom: 15, priority: 1000, ruleId: 'ir_ulid' };
        const imagery = { im_ulid: { id: 'im_ulid', maxZoom: 1, minZoom: 15, priority: 1000 } };
        const recs: any[] = [
            { id: 'im_rec1', name: 'rec1' }, // yes
            { id: 'ts_rec1', name: 'rec2', v: 2, rules: [rule] }, // yes
            { id: 'ts_rec2', name: 'rec3', v: 1, imagery: imagery }, // v1 migrate to v2
        ];
        const dynamo = {
            scan(opts: any): any {
                return {
                    async promise(): Promise<any> {
                        if (opts.TableName !== Const.TileMetadata.TableName) {
                            throw new Error('Wrong table name: ' + opts.TableName);
                        }
                        let sample = recs.slice(0);
                        let lastKey: any = null;
                        if (opts.ExclusiveStartKey === undefined) {
                            sample = recs.slice(0, 1);
                            lastKey = 'ts_rec2';
                        } else if (opts.ExclusiveStartKey === 'ts_rec2') {
                            sample = recs.slice(1);
                        }
                        return {
                            Items: sample.map((r) => DynamoDB.Converter.marshall(r)),
                            LastEvaluatedKey: lastKey,
                        };
                    },
                };
            },
        } as DynamoDB;

        const table = new TileMetadataTable();
        const tileMetadata = new TileMetadataTileSet(table);
        table.dynamo = dynamo;

        const ans = [];

        for await (const item of tileMetadata) {
            ans.push(item);
        }

        const ts_result: any[] = [
            { id: 'ts_rec1', name: 'rec2', v: 2, rules: [rule] },
            { id: 'ts_rec2', name: 'rec3', v: 2, rules: [rule] },
        ];
        o(ans).deepEquals(ts_result);
    });
});
