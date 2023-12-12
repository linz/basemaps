import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { BatchGetItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { ConfigImagery, ConfigTileSet } from '@basemaps/config';
import DynamoDB from 'aws-sdk/clients/dynamodb.js';
import { createSandbox } from 'sinon';

import { ConfigDynamoCached } from '../dynamo.config.cached.js';
import { ConfigProviderDynamo } from '../dynamo.config.js';

class FakeDynamoDb {
  values: Map<string, Record<string, unknown>> = new Map();
  get: unknown[] = [];
  getAll: { RequestItems: { Foo: { Keys: { id: { S: string } }[] } } }[] = [];
  getItem(req: any): { promise(): unknown } {
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

  batchGetItem(req: any): { promise(): unknown } {
    this.getAll.push(req);
    const keys = req.RequestItems.Foo.Keys.map((c: any) => DynamoDB.Converter.unmarshall(c)['id']);
    const output = keys.map((c: string) => this.values.get(c)).filter((f: unknown) => f != null);
    return {
      promise(): Promise<unknown> {
        if (output.length === 0) return Promise.resolve({ Responses: {} });
        return Promise.resolve({ Responses: { Foo: output.map((c: any) => DynamoDB.Converter.marshall(c)) } });
      },
    };
  }

  send(req: any): unknown {
    if (req instanceof BatchGetItemCommand) return this.batchGetItem(req.input).promise();
    if (req instanceof GetItemCommand) return this.getItem(req.input).promise();
    throw new Error('Failed to send request');
  }
}

describe('ConfigDynamo', () => {
  let provider: ConfigProviderDynamo;
  let fakeDynamo: FakeDynamoDb;

  const sandbox = createSandbox();

  beforeEach(() => {
    provider = new ConfigProviderDynamo('Foo');
    fakeDynamo = new FakeDynamoDb();
    provider.dynamo = fakeDynamo as any;
  });

  afterEach(() => sandbox.restore());

  it('should not get if missing', async () => {
    const ret = await provider.TileSet.get('ts_abc123');

    assert.deepEqual(fakeDynamo.get, [{ Key: { id: { S: 'ts_abc123' } }, TableName: 'Foo' }]);
    assert.equal(ret, null);
  });

  it('should get', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });
    const ret = await provider.TileSet.get('ts_abc123');

    assert.deepEqual(fakeDynamo.get, [{ Key: { id: { S: 'ts_abc123' } }, TableName: 'Foo' }]);
    assert.deepEqual(ret, { id: 'ts_abc123' } as ConfigTileSet);
  });

  it('should get-all', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });
    fakeDynamo.values.set('ts_abc456', { id: 'ts_abc456' });
    const ret = await provider.TileSet.getAll(new Set(fakeDynamo.values.keys()));

    assert.deepEqual(fakeDynamo.getAll[0].RequestItems.Foo.Keys, [
      { id: { S: 'ts_abc123' } },
      { id: { S: 'ts_abc456' } },
    ]);
    assert.deepEqual([...ret.values()], [...fakeDynamo.values.values()] as any);
  });

  it('should throw without prefix', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });
    const ret = await provider.TileSet.get('abc123').catch((e) => e);

    assert.deepEqual(fakeDynamo.get, []);
    assert.deepEqual(String(ret), 'Error: Trying to query "abc123" expected prefix of ts');
  });

  it('should get-all partial', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });
    const ret = await provider.TileSet.getAll(new Set(['ts_abc123', 'ts_abc456']));
    assert.deepEqual(fakeDynamo.getAll[0].RequestItems.Foo.Keys, [
      { id: { S: 'ts_abc123' } },
      { id: { S: 'ts_abc456' } },
    ]);
    assert.deepEqual([...ret.values()], [...fakeDynamo.values.values()] as any);
  });

  it('should throw if on wrong prefix', async () => {
    const ret = await provider.TileSet.get('im_abc123').catch((e) => e);
    assert.deepEqual(fakeDynamo.get, []);
    assert.deepEqual(String(ret), 'Error: Trying to query "im_abc123" expected prefix of ts');
  });

  it('should throw on prefixed and un-prefixed', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });

    const ret = provider.TileSet.getAll(new Set(['abc123', 'ts_abc123']));
    const err = await ret.then(() => null).catch((e) => e);
    assert.equal(String(err), 'Error: Trying to query "abc123" expected prefix of ts');
    assert.deepEqual(fakeDynamo.getAll, []);
  });

  describe('DynamoCached', () => {
    it('should get-all with cache', async () => {
      fakeDynamo.values.set('im_abc123', { id: 'im_abc123' });
      fakeDynamo.values.set('im_abc456', { id: 'im_abc456' });

      const cached = provider.Imagery as ConfigDynamoCached<ConfigImagery>;
      cached.cache.set('im_abc123', { id: 'im_abc123' } as ConfigImagery);
      const ret = await provider.Imagery.getAll(new Set(['im_abc123', 'im_abc456']));

      assert.deepEqual(fakeDynamo.getAll[0].RequestItems.Foo.Keys, [{ id: { S: 'im_abc456' } }]);
      assert.deepEqual([...ret.values()], [...fakeDynamo.values.values()] as any);
    });

    it('should get with cache', async () => {
      fakeDynamo.values.set('im_abc123', { id: 'im_abc123' });

      const cached = provider.Imagery as ConfigDynamoCached<ConfigImagery>;
      cached.cache.set('im_abc123', { id: 'im_abc123' } as ConfigImagery);
      const ret = await provider.Imagery.get('im_abc123');

      assert.deepEqual(fakeDynamo.get, []);
      assert.deepEqual(ret, { id: 'im_abc123' } as ConfigImagery);
    });
  });
});
