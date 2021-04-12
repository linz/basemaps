import { Epsg } from '@basemaps/geo';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { ConfigDynamo } from '../dynamo.config';

o.spec('ConfigDynamoVersioned', () => {
    const config = new ConfigDynamo('Foo');
    const sandbox = createSandbox();

    o.afterEach(() => sandbox.restore());

    o.spec('create', () => {
        o('Should create initial tags', async () => {
            const put = sandbox.stub(config.TileSet, 'put');
            const get = sandbox.stub(config.TileSet, 'get').callsFake(async () => null);

            await config.TileSet.create({ name: 'test', projection: Epsg.Google, imagery: {} } as any);

            o(get.callCount).equals(1);
            o(get.firstCall.firstArg).equals('ts_test_3857_head');
            o(put.callCount).equals(2);
            o(put.firstCall.firstArg.id).equals('ts_test_3857_v000000');
            o(put.secondCall.firstArg.id).equals('ts_test_3857_head');
        });

        o('should increment version number', async () => {
            const put = sandbox.stub(config.TileSet, 'put');
            const get = sandbox.stub(config.TileSet, 'get').callsFake(async () => ({ revisions: 5 } as any));
            const res = await config.TileSet.create({ name: 'test', projection: Epsg.Google, imagery: {} } as any);

            o(get.callCount).equals(1);
            o(get.firstCall.firstArg).equals('ts_test_3857_head');
            o(put.callCount).equals(2);
            o(put.firstCall.firstArg.id).equals('ts_test_3857_v000006');
            o(put.secondCall.firstArg.id).equals('ts_test_3857_head');

            o(res.version).equals(6);
            o(res.revisions).equals(6);

            get.callsFake(() => Promise.resolve(res));
            const resB = await config.TileSet.create({ name: 'test', projection: Epsg.Google, imagery: {} } as any);
            o(res.version).equals(6);
            o(resB.version).equals(7);
            o(resB.revisions).equals(7);
        });
    });

    o.spec('tag', () => {
        o('should create tags', async () => {
            const get = sandbox.stub(config.TileSet, 'get');
            const put = sandbox.stub(config.TileSet, 'put');

            const res = await config.TileSet.tag(
                { name: 'test', projection: Epsg.Google.code, version: 5 } as any,
                config.Tag.Production,
            );
            o(res.id).equals('ts_test_3857_production');
            o(get.callCount).equals(0);
            o(put.callCount).equals(1);
            o(put.firstCall.firstArg.id).equals('ts_test_3857_production');
        });
    });
});
