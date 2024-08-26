import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { BatchGetItemCommand, DynamoDB, GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { ConfigImagery, ConfigTileSet } from '@basemaps/config';
import { createSandbox } from 'sinon';

import { ConfigProviderDynamo } from '../dynamo.config.js';

interface GetAllFoo {
  RequestItems: { Foo: { Keys: { id: { S: string } }[] } };
}
class FakeDynamoDb {
  values: Map<string, Record<string, unknown>> = new Map();
  get: unknown[] = [];
  getAll: GetAllFoo[] = [];
  getItem(req: GetItemCommandInput): { promise(): unknown } {
    this.get.push(req);
    const reqId = req.Key?.['id'].S as string;
    const val = this.values.get(reqId);
    return {
      promise(): Promise<unknown> {
        if (val) return Promise.resolve({ Item: marshall(val) });
        return Promise.resolve(null);
      },
    };
  }

  batchGetItem(req: GetAllFoo): { promise(): unknown } {
    this.getAll.push(req);
    const keys = req.RequestItems.Foo.Keys.map((c) => c.id.S);
    const output = keys.map((c: string) => this.values.get(c)).filter((f: unknown) => f != null);
    return {
      promise(): Promise<unknown> {
        if (output.length === 0) return Promise.resolve({ Responses: {} });
        return Promise.resolve({ Responses: { Foo: output.map((c: any) => marshall(c)) } });
      },
    };
  }

  send(req: BatchGetItemCommand | GetItemCommand): unknown {
    if (req instanceof BatchGetItemCommand) return this.batchGetItem(req.input as GetAllFoo).promise();
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
    provider.dynamo = fakeDynamo as unknown as DynamoDB;
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
    const ret = await provider.TileSet.get('abc123');
    assert.equal(ret?.id, 'ts_abc123');
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

  it('should not throw if on wrong prefix', async () => {
    fakeDynamo.values.set('im_abc123', { id: 'im_abc123' });

    const ret = await provider.TileSet.get('im_abc123');
    assert.equal(ret, undefined); // Query will be for ts_im_abc123
  });

  it('should not on prefixed and un-prefixed', async () => {
    fakeDynamo.values.set('ts_abc123', { id: 'ts_abc123' });

    await provider.TileSet.getAll(new Set(['abc123', 'ts_abc123']));
    assert.deepEqual(fakeDynamo.getAll[0].RequestItems.Foo.Keys, [
      { id: { S: 'ts_abc123' } },
      { id: { S: 'ts_abc123' } },
    ]);
  });

  describe('DynamoCached', () => {
    it('should get-all with cache', async () => {
      fakeDynamo.values.set('im_abc123', { id: 'im_abc123' });
      fakeDynamo.values.set('im_abc456', { id: 'im_abc456' });

      const cached = provider.Imagery;
      cached.cache.set('im_abc123', { id: 'im_abc123' } as ConfigImagery);
      const ret = await provider.Imagery.getAll(new Set(['im_abc123', 'im_abc456']));

      assert.deepEqual(fakeDynamo.getAll[0].RequestItems.Foo.Keys, [{ id: { S: 'im_abc456' } }]);
      assert.deepEqual([...ret.values()], [...fakeDynamo.values.values()] as any);
    });

    it('should get with cache', async () => {
      fakeDynamo.values.set('im_abc123', { id: 'im_abc123' });

      const cached = provider.Imagery;
      cached.cache.set('im_abc123', { id: 'im_abc123' } as ConfigImagery);
      const ret = await provider.Imagery.get('im_abc123');

      assert.deepEqual(fakeDynamo.get, []);
      assert.deepEqual(ret, { id: 'im_abc123' } as ConfigImagery);
    });
  });
});
