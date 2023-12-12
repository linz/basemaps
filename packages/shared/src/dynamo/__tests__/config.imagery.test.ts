import assert from 'node:assert';
import { describe, it } from 'node:test';

import { BatchGetItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { ConfigId, ConfigImagery, ConfigPrefix, getAllImagery } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';

import { ConfigProviderDynamo } from '../dynamo.config.js';

describe('ConfigProvider.Imagery', () => {
  const provider = new ConfigProviderDynamo('Foo');

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

  it('Should get all Imagery', async (t) => {
    const items = new Map();
    items.set('im_foo1', item);
    items.set('im_foo2', item);
    items.set('im_foo4', item);
    const get = t.mock.method(provider.Imagery, 'getAll', () => Promise.resolve(items));

    const layers = [{ [3857]: 'foo1' }, { [3857]: 'im_foo2' }, { [2193]: 'foo3', [3857]: 'im_foo4' }] as any;

    const result = await getAllImagery(provider, layers, [Epsg.Google]);
    const firstCall = get.mock.calls[0]?.arguments[0];
    assert.equal(get.mock.callCount(), 1);
    assert.deepEqual([...(firstCall?.keys() ?? [])], ['im_foo1', 'im_foo2', 'im_foo4']);
    assert.deepEqual(result.get('im_foo1'), item);
    assert.deepEqual(result.get('im_foo2'), item);
    assert.equal(result.get('im_foo3'), undefined);
    assert.deepEqual(result.get('im_foo4'), item);
  });

  it('should handle unprocessed keys', async (t) => {
    const bulk = t.mock.method(provider.dynamo, 'send', (req: any) => {
      const keys = req.input.RequestItems[provider.tableName].Keys;

      // Only return one element and label the rest as unprocessed
      const ret = keys.slice(0, 1);
      const rest = keys.slice(1);
      const output = { Responses: { [provider.tableName]: ret } } as BatchGetItemCommandOutput;
      if (rest.length > 0) output.UnprocessedKeys = { [provider.tableName]: { Keys: rest } };
      return Promise.resolve(output);
    });
    const result = await provider.Provider.getAll(new Set(['pv_1234', 'pv_2345']));

    assert.equal(bulk.mock.callCount(), 2);
    assert.equal(result.get('pv_1234')?.id, 'pv_1234');
    assert.equal(result.get('pv_2345')?.id, 'pv_2345');
  });
});
