import { EpsgCode } from '@basemaps/geo';
import { Epsg } from '@basemaps/geo';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import o from 'ospec';
import { Const } from '../../const';
import { BaseDynamoTable } from '../aws.dynamo.table';
import { TileMetadataTable } from '../tile.metadata';
import { TileMetadataNamedTag, TileSetVectorRecord } from '../tile.metadata.base';
import { TileMetadataVector } from '../tile.metadata.vector';

const promiseNull = async (): Promise<unknown> => null;
async function throws(cb: () => Promise<any>, re: RegExp): Promise<void> {
    try {
        await cb();
        o(true).equals(false)(`Should have thrown`);
    } catch (e) {
        o(re.test(e)).equals(true)(`${e.message} should match ${re}`);
    }
}

o.spec('tile.metadata.vector', () => {
    const metadata = {
        put: o.spy<TileSetVectorRecord[], Promise<any>>(promiseNull) as any,
        get: o.spy<string[], Promise<any>>(promiseNull),
    };
    const vt = new TileMetadataVector(metadata as any);

    o.beforeEach(() => {
        metadata.get = o.spy(promiseNull);
        metadata.put = o.spy(promiseNull);
    });

    o.spec('create', () => {
        o('Should create initial tags', async () => {
            await vt.create({ name: 'test', projection: Epsg.Google, layers: [] } as any);

            o(metadata.get.callCount).equals(1);
            o(metadata.get.args[0]).equals('ts_test_3857_head');
            o(metadata.put.callCount).equals(2);
            o(metadata.put.calls[0].args[0].id).equals('ts_test_3857_v000000');
            o(metadata.put.calls[1].args[0].id).equals('ts_test_3857_head');
        });

        o('should create records', async () => {
            const res = await vt.create({
                name: 'test',
                projection: Epsg.Google,
                layers: ['url1.pbf', 'url2.pbf'],
            } as any);

            o(res.id).equals('ts_test_3857_head');
            o(res.layers.length).equals(2);
            o(res.layers[0]).equals('url1.pbf');
            o(res.layers[1]).equals('url2.pbf');
        });

        o('should increment version number', async () => {
            metadata.get = o.spy(() => Promise.resolve({ revisions: 5 }));
            const res = await vt.create({
                name: 'test',
                projection: Epsg.Google,
                layers: [],
            } as any);

            o(metadata.get.callCount).equals(1);
            o(metadata.get.args[0]).equals('ts_test_3857_head');
            o(metadata.put.callCount).equals(2);
            o(metadata.put.calls[0].args[0].id).equals('ts_test_3857_v000006');
            o(metadata.put.calls[1].args[0].id).equals('ts_test_3857_head');

            o(res.version).equals(6);
            o(res.revisions).equals(6);

            metadata.get = o.spy(() => Promise.resolve(res));
            const resB = await vt.create({
                name: 'test',
                projection: Epsg.Google,
                layers: [],
            } as any);
            o(res.version).equals(6);
            o(resB.version).equals(7);
            o(resB.revisions).equals(7);
        });
    });

    o.spec('tag', () => {
        o('should fail if version does not exist', async () => {
            await throws(() => vt.tag('test', Epsg.Google, TileMetadataNamedTag.Production, 5), /ts_test_3857_v000005/);
        });

        o('should fail if tagging head', async () => {
            await throws(() => vt.tag('test', Epsg.Google, TileMetadataNamedTag.Head, 5), /Cannot overwrite head tag/);
        });

        o('should create tags', async () => {
            metadata.get = o.spy(() => Promise.resolve({ revisions: 5 }));
            const res = await vt.tag('test', Epsg.Google, TileMetadataNamedTag.Production, 5);
            o(res.id).equals('ts_test_3857_production');
            o(metadata.get.callCount).equals(1);
            o(metadata.put.callCount).equals(1);
            o(metadata.put.args[0].id).equals('ts_test_3857_production');
        });
    });

    o.spec('idSplit', () => {
        function fakeRecord(id: string, version: number): TileSetVectorRecord {
            const rec = vt.initialRecord('rec', EpsgCode.Google, ['url1.pbf', 'url2.pbf'], 'url.json');
            rec.id = id;
            rec.version = version;
            return rec;
        }

        o('should return null for unexpected ids', () => {
            o(vt.idSplit(fakeRecord('wrongId', 0))).equals(null);
            o(vt.idSplit(fakeRecord('im_test_3857_head', 2))).equals(null);
            o(vt.idSplit(fakeRecord('ts_test_0000_production', 1))).equals(null);
            o(vt.idSplit(fakeRecord('ts_test_3857_v000006', 7))).equals(null);
        });

        o('should split ids', () => {
            o(vt.idSplit(fakeRecord('ts_test_3857_head', 1))).deepEquals({
                name: 'test',
                projection: Epsg.Google,
                tag: 'head',
                version: 1,
            });
            o(vt.idSplit(fakeRecord('ts_test_2193_pr-12', 2))).deepEquals({
                name: 'test',
                projection: Epsg.Nztm2000,
                tag: 'pr-12',
                version: 2,
            });
            o(vt.idSplit(fakeRecord('ts_test_3857_v000006', 6))).deepEquals({
                name: 'test',
                projection: Epsg.Google,
                tag: 'v000006',
                version: 6,
            });
        });
    });

    o.spec('parse', () => {
        o('should parse @ syntax', () => {
            o(vt.parse('topolike@head')).deepEquals({ name: 'topolike', tag: TileMetadataNamedTag.Head });
            o(vt.parse('topolike@production')).deepEquals({
                name: 'topolike',
                tag: TileMetadataNamedTag.Production,
            });
            o(vt.parse('topolike@beta')).deepEquals({ name: 'topolike', tag: TileMetadataNamedTag.Beta });
            o(vt.parse('topolike@pr-123')).deepEquals({ name: 'topolike', tag: 'pr-123' });
        });

        o('should throw with invalid tags', () => {
            o(vt.parse('topolike@foo')).deepEquals({ name: 'topolike@foo' });
            o(vt.parse('TopoLike@9FooBar')).deepEquals({ name: 'TopoLike@9FooBar' });
        });

        o('should be case sensitive', () => {
            o(vt.parse('ToPolIke@BETA')).deepEquals({ name: 'ToPolIke@BETA' });
            o(vt.parse('ToPolIke@HEAD')).deepEquals({ name: 'ToPolIke@HEAD' });
        });
    });

    o('recordIsTileSet', () => {
        const table = new TileMetadataTable();

        const item: BaseDynamoTable = { id: 'ts_foo', name: 'abc' } as any;
        o(table.Vector.recordIsTileSet(item)).equals(true);
        o(table.Vector.recordIsTileSet({ id: 'im_foo' } as any)).equals(false);
    });

    o('asyncIterator', async () => {
        const recs: any[] = [
            { id: 'im_rec1', name: 'rec1' }, // yes
            { id: 'ts_rec1', name: 'rec2', layers: ['url1'] }, // yes
            { id: 'ts_rec2', name: 'rec3', layers: ['url1', 'url2'] }, // yes
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
        const tileMetadata = new TileMetadataVector(table);
        table.dynamo = dynamo;

        const ans = [];

        for await (const item of tileMetadata) {
            ans.push(item);
        }

        const ts_result: any[] = [
            { id: 'ts_rec1', name: 'rec2', layers: ['url1'] },
            { id: 'ts_rec2', name: 'rec3', layers: ['url1', 'url2'] },
        ];
        o(ans).deepEquals(ts_result);
    });
});
