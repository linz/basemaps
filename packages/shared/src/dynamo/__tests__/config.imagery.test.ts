import { ConfigId, ConfigImagery, ConfigPrefix, getAllImagery } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import DynamoDB from 'aws-sdk/clients/dynamodb.js';
import o from 'ospec';
import sinon from 'sinon';
import { ConfigProviderDynamo } from '../dynamo.config.js';

const sandbox = sinon.createSandbox();

o.spec('ConfigProvider.Imagery', () => {
  const provider = new ConfigProviderDynamo('Foo');

  o.afterEach(() => sandbox.restore());

  const item: ConfigImagery = { id: 'im_foo', name: 'abc' } as any;

  o('isWriteable', () => {
    o(provider.Imagery.isWriteable()).equals(true);
    // Validate the typing works
    if (provider.Imagery.isWriteable()) o(typeof provider.Imagery.put).equals('function');
  });

  o('prefix', () => {
    o(ConfigId.prefix(ConfigPrefix.Imagery, '1234')).equals('im_1234');
    o(ConfigId.prefix(ConfigPrefix.Imagery, 'im_1234')).equals('im_1234');
    o(ConfigId.prefix(ConfigPrefix.TileSet, '1234')).equals('ts_1234');
    o(ConfigId.prefix(ConfigPrefix.TileSet, '')).equals('');
  });

  o('unprefix', () => {
    o(ConfigId.unprefix(ConfigPrefix.Imagery, 'im_1234')).equals('1234');
    o(ConfigId.unprefix(ConfigPrefix.Imagery, 'ts_1234')).equals('ts_1234');
    o(ConfigId.unprefix(ConfigPrefix.Imagery, '1234')).equals('1234');
  });

  o('is', () => {
    o(provider.Imagery.is(item)).equals(true);
    o(provider.Imagery.is({ id: 'ts_foo' } as any)).equals(false);
    if (provider.Imagery.is(item)) {
      o(item.name).equals('abc'); // tests compiler
    }
  });

  o('Should get all Imagery', async () => {
    const items = new Map();
    items.set('im_foo1', item);
    items.set('im_foo2', item);
    items.set('im_foo4', item);
    const get = sandbox.stub(provider.Imagery, 'getAll').resolves(items);

    const layers = [{ [3857]: 'foo1' }, { [3857]: 'im_foo2' }, { [2193]: 'foo3', [3857]: 'im_foo4' }] as any;

    const result = await getAllImagery(provider, layers, [Epsg.Google]);
    o(get.callCount).equals(1);
    o([...get.firstCall.firstArg.keys()]).deepEquals(['im_foo1', 'im_foo2', 'im_foo4']);
    o(result.get('im_foo1')).deepEquals(item);
    o(result.get('im_foo2')).deepEquals(item);
    o(result.get('im_foo3')).equals(undefined);
    o(result.get('im_foo4')).deepEquals(item);
  });

  o('should handle unprocessed keys', async () => {
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

    o(bulk.callCount).equals(2);
    o(result.get('pv_1234')?.id).equals('pv_1234');
    o(result.get('pv_2345')?.id).equals('pv_2345');
  });
});
