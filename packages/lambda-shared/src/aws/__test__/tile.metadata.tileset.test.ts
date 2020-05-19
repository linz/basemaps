import * as o from 'ospec';
import { TileMetadataTileSet } from '../tile.metadata.tileset';
import { EPSG } from '@basemaps/geo';
import { TileMetadataSetRecord, TileSetTag } from '../tile.metadata';

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
            await ts.create({ name: 'test', projection: EPSG.Google } as any);

            o(metadata.get.callCount).equals(1);
            o(metadata.get.args[0]).equals('ts_test_3857_head');
            o(metadata.put.callCount).equals(3);
            o(metadata.put.calls[0].args[0].id).equals('ts_test_3857_v000000');
            o(metadata.put.calls[1].args[0].id).equals('ts_test_3857_production');
            o(metadata.put.calls[2].args[0].id).equals('ts_test_3857_head');
        });

        o('should increment version number', async () => {
            metadata.get = o.spy(() => Promise.resolve({ revisions: 5 }));
            const res = await ts.create({ name: 'test', projection: EPSG.Google } as any);

            o(metadata.get.callCount).equals(1);
            o(metadata.get.args[0]).equals('ts_test_3857_head');
            o(metadata.put.callCount).equals(2);
            o(metadata.put.calls[0].args[0].id).equals('ts_test_3857_v000006');
            o(metadata.put.calls[1].args[0].id).equals('ts_test_3857_head');

            o(res.version).equals(6);
            o(res.revisions).equals(6);

            metadata.get = o.spy(() => Promise.resolve(res));
            const resB = await ts.create({ name: 'test', projection: EPSG.Google } as any);
            o(res.version).equals(6);
            o(resB.version).equals(7);
            o(resB.revisions).equals(7);
        });
    });

    o.spec('tag', () => {
        o('should fail if version does not exist', async () => {
            await throws(() => ts.tag('test', EPSG.Google, TileSetTag.Production, 5), /ts_test_3857_v000005/);
        });

        o('should fail if tagging head', async () => {
            await throws(() => ts.tag('test', EPSG.Google, TileSetTag.Head, 5), /Cannot overwrite head tag/);
        });

        o('should create tags', async () => {
            metadata.get = o.spy(() => Promise.resolve({ revisions: 5 }));
            const res = await ts.tag('test', EPSG.Google, TileSetTag.Production, 5);
            o(res.id).equals('ts_test_3857_production');
            o(metadata.get.callCount).equals(1);
            o(metadata.put.callCount).equals(1);
            o(metadata.put.args[0].id).equals('ts_test_3857_production');
        });
    });

    o.spec('id', () => {
        o('should create version ids', () => {
            o(ts.id('test', EPSG.Google, 5)).equals('ts_test_3857_v000005');
            o(ts.id('test', EPSG.Google, 32)).equals('ts_test_3857_v000032');
            o(ts.id('test', EPSG.Google, Number.MAX_SAFE_INTEGER)).equals('ts_test_3857_v9007199254740991');
        });

        o('should create tag ids', () => {
            o(ts.id('test', EPSG.Google, TileSetTag.Production)).equals('ts_test_3857_production');
            o(ts.id('test', EPSG.Google, TileSetTag.Head)).equals('ts_test_3857_head');
            o(ts.id('test', EPSG.Google, TileSetTag.Beta)).equals('ts_test_3857_beta');
        });
    });

    o.spec('parse', () => {
        o('should parse @ syntax', () => {
            o(ts.parse('aerial@head')).deepEquals({ name: 'aerial', tag: TileSetTag.Head });
            o(ts.parse('aerial@production')).deepEquals({ name: 'aerial', tag: TileSetTag.Production });
            o(ts.parse('aerial@beta')).deepEquals({ name: 'aerial', tag: TileSetTag.Beta });
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
});
