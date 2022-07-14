import DynamoDB from 'aws-sdk/clients/dynamodb.js';
import o from 'ospec';
import sinon from 'sinon';
import { Config } from '../../base.config.js';
import { ConfigImagery } from '../../config/imagery.js';
import { ConfigTileSet } from '../../config/tile.set.js';
import { ConfigDynamoCached } from '../dynamo.config.cached.js';
import { ConfigProviderDynamo } from '../dynamo.config.js';

const sandbox = sinon.createSandbox();

class FakeDynamoDb {
  values: Map<string, Record<string, unknown>> = new Map();
  get: unknown[] = [];
  getAll: { RequestItems: { Foo: { Keys: { id: { S: string } }[] } } }[] = [];
  getItem(req: any): unknown {
    this.get.push(req);
    const reqId = req.Key.id.S;
    const val = this.values.get(reqId);
    return {
      promise(): Promise<unknown> {
        if (val) return Promise.resolve({ Item: DynamoDB.Converter.marshall(val) });
        return Promise.resolve(null);
      },
    };
  }

  batchGetItem(req: any): unknown {
    this.getAll.push(req);
    const keys = req.RequestItems.Foo.Keys.map((c: any) => DynamoDB.Converter.unmarshall(c).id);
    const output = keys.map((c: string) => this.values.get(c)).filter((f: unknown) => f != null);
    return {
      promise(): Promise<unknown> {
        if (output.length === 0) return Promise.resolve({ Responses: {} });
        return Promise.resolve({ Responses: { Foo: output.map((c: any) => DynamoDB.Converter.marshall(c)) } });
      },
    };
  }
}

o.spec('ConfigDynamo', () => {
  let provider: ConfigProviderDynamo;
  let fakeDynamo: FakeDynamoDb;

  o.beforeEach(() => {
    provider = new ConfigProviderDynamo('Foo');
    Config.setConfigProvider(provider);
    fakeDynamo = new FakeDynamoDb();
    provider.dynamo = fakeDynamo as any;
  });

  o.afterEach(() => sandbox.restore());

  o('should not get if missing', async () => {
    const ret = await Config.TileSet.get('ts_abc123');

    o(fakeDynamo.get).deepEquals([{ Key: { id: { S: 'ts_abc123' } }, TableName: 'Foo' }]);
    o(ret).equals(null);
  });

  o('should get', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });
    const ret = await Config.TileSet.get('ts_abc123');

    o(fakeDynamo.get).deepEquals([{ Key: { id: { S: 'ts_abc123' } }, TableName: 'Foo' }]);
    o(ret).deepEquals({ id: 'ts_abc123' } as ConfigTileSet);
  });

  o('should get-all', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });
    fakeDynamo.values.set('ts_abc456', { id: 'ts_abc456' });
    const ret = await Config.TileSet.getAll(new Set(fakeDynamo.values.keys()));

    o(fakeDynamo.getAll[0].RequestItems.Foo.Keys).deepEquals([{ id: { S: 'ts_abc123' } }, { id: { S: 'ts_abc456' } }]);
    o([...ret.values()]).deepEquals([...fakeDynamo.values.values()] as any);
  });

  o('should get without prefix', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });
    const ret = await Config.TileSet.get('abc123');

    o(fakeDynamo.get).deepEquals([{ Key: { id: { S: 'ts_abc123' } }, TableName: 'Foo' }]);
    o(ret).deepEquals({ id: 'ts_abc123' } as ConfigTileSet);
  });

  o('should get-all without prefix', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });
    fakeDynamo.values.set('ts_abc456', { id: 'ts_abc456' });
    const ret = await Config.TileSet.getAll(new Set(['abc123', 'ts_abc456']));

    o(fakeDynamo.getAll[0].RequestItems.Foo.Keys).deepEquals([{ id: { S: 'ts_abc123' } }, { id: { S: 'ts_abc456' } }]);
    o([...ret.values()]).deepEquals([...fakeDynamo.values.values()] as any);
  });

  o('should get-all partial', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });
    const ret = await Config.TileSet.getAll(new Set(['abc123', 'ts_abc456']));
    o(fakeDynamo.getAll[0].RequestItems.Foo.Keys).deepEquals([{ id: { S: 'ts_abc123' } }, { id: { S: 'ts_abc456' } }]);
    o([...ret.values()]).deepEquals([...fakeDynamo.values.values()] as any);
  });

  o('should force a prefix even if prefix is defined', async () => {
    const ret = await Config.TileSet.get('im_abc123');

    o(fakeDynamo.get).deepEquals([{ Key: { id: { S: 'ts_im_abc123' } }, TableName: 'Foo' }]);
    o(ret).deepEquals(null);
  });

  o.spec('DynamoCached', () => {
    o('should get-all with cache', async () => {
      fakeDynamo.values.set('im_abc123', { id: 'im_abc123' });
      fakeDynamo.values.set('im_abc456', { id: 'im_abc456' });

      const cached = Config.Imagery as ConfigDynamoCached<ConfigImagery>;
      cached.cache.set('im_abc123', { id: 'im_abc123' } as ConfigImagery);
      const ret = await Config.Imagery.getAll(new Set(['abc123', 'im_abc456']));

      o(fakeDynamo.getAll[0].RequestItems.Foo.Keys).deepEquals([{ id: { S: 'im_abc456' } }]);
      o([...ret.values()]).deepEquals([...fakeDynamo.values.values()] as any);
    });

    o('should get with cache', async () => {
      fakeDynamo.values.set('im_abc123', { id: 'im_abc123' });

      const cached = Config.Imagery as ConfigDynamoCached<ConfigImagery>;
      cached.cache.set('im_abc123', { id: 'im_abc123' } as ConfigImagery);
      const ret = await Config.Imagery.get('abc123');

      o(fakeDynamo.get).deepEquals([]);
      o(ret).deepEquals({ id: 'im_abc123' } as ConfigImagery);

      const retPrefixed = await Config.Imagery.get('im_abc123');
      o(fakeDynamo.get).deepEquals([]);
      o(retPrefixed).deepEquals({ id: 'im_abc123' } as ConfigImagery);
    });
  });
});
