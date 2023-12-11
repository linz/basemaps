import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';

import { ConfigId, ConfigImagery, ConfigPrefix, getAllImagery } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import DynamoDB from 'aws-sdk/clients/dynamodb.js';
import sinon from 'sinon';

import { ConfigProviderDynamo } from '../dynamo.config.js';

const sandbox = sinon.createSandbox();

describe('ConfigProvider.Imagery', () => {
  const provider = new ConfigProviderDynamo('Foo');

  afterEach(() => sandbox.restore());

  const item: ConfigImagery = { id: 'im_foo', name: 'abc' } as any;

  it('isWriteable', () => {
    assert.equal(provider.Imagery.isWriteable(), true);
    // Validate the typing works
    if (provider.Imagery.isWriteable()) assert.equal(typeof provider.Imagery.put, 'function');
  });

  it('prefix', () => {
    assert.equal(ConfigId.prefix(ConfigPrefix.Imagery, '1234'), 'im_1234');
    assert.equal(ConfigId.prefix(ConfigPrefix.Imagery, 'im_1234'), 'im_1234');
    assert.equal(ConfigId.prefix(ConfigPrefix.TileSet, '1234'), 'ts_1234');
    assert.equal(ConfigId.prefix(ConfigPrefix.TileSet, ''), '');
  });

  it('unprefix', () => {
    assert.equal(ConfigId.unprefix(ConfigPrefix.Imagery, 'im_1234'), '1234');
    assert.equal(ConfigId.unprefix(ConfigPrefix.Imagery, 'ts_1234'), 'ts_1234');
    assert.equal(ConfigId.unprefix(ConfigPrefix.Imagery, '1234'), '1234');
  });

  it('is', () => {
    assert.equal(provider.Imagery.is(item), true);
    assert.equal(provider.Imagery.is({ id: 'ts_foo' } as any), false);
    if (provider.Imagery.is(item)) {
      assert.equal(item.name, 'abc'); // tests compiler
    }
  });

  it('Should get all Imagery', async () => {
    const items = new Map();
    items.set('im_foo1', item);
    items.set('im_foo2', item);
    items.set('im_foo4', item);
    const get = sandbox.stub(provider.Imagery, 'getAll').resolves(items);

    const layers = [{ [3857]: 'foo1' }, { [3857]: 'im_foo2' }, { [2193]: 'foo3', [3857]: 'im_foo4' }] as any;

    const result = await getAllImagery(provider, layers, [Epsg.Google]);
    assert.equal(get.callCount, 1);
    assert.deepEqual([...get.firstCall.firstArg.keys()], ['im_foo1', 'im_foo2', 'im_foo4']);
    assert.deepEqual(result.get('im_foo1'), item);
    assert.deepEqual(result.get('im_foo2'), item);
    assert.equal(result.get('im_foo3'), undefined);
    assert.deepEqual(result.get('im_foo4'), item);
  });

  it('should handle unprocessed keys', async () => {
    const bulk = sandbox.stub(provider.dynamo, 'batchGetItem').callsFake((req: any) => {
      const keys = req.RequestItems[provider.tableName].Keys;
      return {
        promise() {
          // Only return one element and label the rest as unprocessed
          const ret = keys.slice(0, 1);
          const rest = keys.slice(1);
          const output: DynamoDB.BatchGetItemOutput = { Responses: { [provider.tableName]: ret } };
          if (rest.length > 0) output.UnprocessedKeys = { [provider.tableName]: { Keys: rest } };
          return Promise.resolve(output);
        },
      } as any;
    });
    const result = await provider.Provider.getAll(new Set(['pv_1234', 'pv_2345']));

    assert.equal(bulk.callCount, 2);
    assert.equal(result.get('pv_1234')?.id, 'pv_1234');
    assert.equal(result.get('pv_2345')?.id, 'pv_2345');
  });
});
