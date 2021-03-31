import DynamoDB from 'aws-sdk/clients/dynamodb';
import o from 'ospec';
import { Const } from '../../const';
import { BaseDynamoTable } from '../aws.dynamo.table';
import { TileMetadataTable } from '../tile.metadata';
import { TileMetadataNamedTag, TileSetStyleRecord } from '../tile.metadata.base';
import { TileMetadataStyle } from '../tile.metadata.style';

const promiseNull = async (): Promise<unknown> => null;
async function throws(cb: () => Promise<any>, re: RegExp): Promise<void> {
    try {
        await cb();
        o(true).equals(false)(`Should have thrown`);
    } catch (e) {
        o(re.test(e)).equals(true)(`${e.message} should match ${re}`);
    }
}

const source = { testSource: { type: 'vector', url: 'testURl' } };
const layer = {
    id: 'Background',
    type: 'background',
    minzoom: 0,
    layout: { visibility: 'visible' },
    paint: { 'background-color': 'rgba(206, 229, 242, 1)' },
};
const style = {
    version: 8,
    name: 'test',
    sources: source,
    layers: [layer],
};
const styleJson = JSON.stringify(style);

o.spec('tile.metadata.style', () => {
    const metadata = {
        put: o.spy<TileSetStyleRecord[], Promise<any>>(promiseNull) as any,
        get: o.spy<string[], Promise<any>>(promiseNull),
    };
    const st = new TileMetadataStyle(metadata as any);

    o.beforeEach(() => {
        metadata.get = o.spy(promiseNull);
        metadata.put = o.spy(promiseNull);
    });

    o.spec('create', () => {
        o('Should create initial tags', async () => {
            await st.create({ tileSetName: 'test', style: {} } as any);

            o(metadata.get.callCount).equals(1);
            o(metadata.get.args[0]).equals('st_test_head');
            o(metadata.put.callCount).equals(2);
            o(metadata.put.calls[0].args[0].id).equals('st_test_v000000');
            o(metadata.put.calls[1].args[0].id).equals('st_test_head');
        });

        o('should create records', async () => {
            const res = await st.create({
                tileSetName: 'test',
                style: styleJson,
            } as any);

            o(res.id).equals('st_test_head');
            const style = JSON.parse(res.style);
            o(style.name).equals('test');
            o(style.sources).deepEquals(source);
            o(style.layers.length).equals(1);
            o(style.layers[0]).deepEquals(layer);
        });

        o('should increment version number', async () => {
            metadata.get = o.spy(() => Promise.resolve({ revisions: 5 }));
            const res = await st.create({
                tileSetName: 'test',
                style: styleJson,
            } as any);

            o(metadata.get.callCount).equals(1);
            o(metadata.get.args[0]).equals('st_test_head');
            o(metadata.put.callCount).equals(2);
            o(metadata.put.calls[0].args[0].id).equals('st_test_v000006');
            o(metadata.put.calls[1].args[0].id).equals('st_test_head');

            o(res.version).equals(6);
            o(res.revisions).equals(6);

            metadata.get = o.spy(() => Promise.resolve(res));
            const resB = await st.create({ tileSetName: 'test', styleJson } as any);
            o(res.version).equals(6);
            o(resB.version).equals(7);
            o(resB.revisions).equals(7);
        });
    });

    o.spec('tag', () => {
        o('should fail if version does not exist', async () => {
            await throws(() => st.tag('test', TileMetadataNamedTag.Production, 5), /st_test_v000005/);
        });

        o('should fail if tagging head', async () => {
            await throws(() => st.tag('test', TileMetadataNamedTag.Head, 5), /Cannot overwrite head tag/);
        });

        o('should create tags', async () => {
            metadata.get = o.spy(() => Promise.resolve({ revisions: 5 }));
            const res = await st.tag('test', TileMetadataNamedTag.Production, 5);
            o(res.id).equals('st_test_production');
            o(metadata.get.callCount).equals(1);
            o(metadata.put.callCount).equals(1);
            o(metadata.put.args[0].id).equals('st_test_production');
        });
    });

    o.spec('idSplit', () => {
        function fakeRecord(id: string, version: number): TileSetStyleRecord {
            const rec = st.initialRecord('rec', styleJson);
            rec.id = id;
            rec.version = version;
            return rec;
        }

        o('should return null for unexpected ids', () => {
            o(st.idSplit(fakeRecord('wrongId', 0))).equals(null);
            o(st.idSplit(fakeRecord('ts_test_head', 2))).equals(null);
            o(st.idSplit(fakeRecord('st_test_wrong', 1))).equals(null);
            o(st.idSplit(fakeRecord('st_test_3857_v000006', 7))).equals(null);
        });

        o('should split ids', () => {
            o(st.idSplit(fakeRecord('st_test_head', 1))).deepEquals({
                tileSetName: 'test',
                tag: 'head',
                version: 1,
            });
            o(st.idSplit(fakeRecord('st_test_pr-12', 2))).deepEquals({
                tileSetName: 'test',
                tag: 'pr-12',
                version: 2,
            });
            o(st.idSplit(fakeRecord('st_test_v000006', 6))).deepEquals({
                tileSetName: 'test',
                tag: 'v000006',
                version: 6,
            });
        });
    });

    o('recordIsStyle', () => {
        const table = new TileMetadataTable();

        const item: BaseDynamoTable = { id: 'ts_foo', name: 'abc' } as any;
        o(table.Vector.recordIsTileSet(item)).equals(true);
        o(table.Vector.recordIsTileSet({ id: 'im_foo' } as any)).equals(false);
    });

    o('asyncIterator', async () => {
        const recs: any[] = [
            { id: 'ts_rec1', name: 'rec1' }, // yes
            { id: 'st_rec1', tileSetName: 'rec2', style: styleJson }, // yes
            { id: 'st_rec2', tileSetName: 'rec3', style: styleJson }, // yes
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
                            lastKey = 'st_rec2';
                        } else if (opts.ExclusiveStartKey === 'st_rec2') {
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
        const tileMetadata = new TileMetadataStyle(table);
        table.dynamo = dynamo;

        const ans = [];

        for await (const item of tileMetadata) {
            ans.push(item);
        }

        const ts_result: any[] = [
            { id: 'st_rec1', tileSetName: 'rec2', style: styleJson },
            { id: 'st_rec2', tileSetName: 'rec3', style: styleJson },
        ];
        o(ans).deepEquals(ts_result);
    });
});
