import { Epsg, EpsgCode, NamedBounds, QuadKey, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import o from 'ospec';
import sinon from 'sinon';
import { Config } from '../../base.config.js';
import { ConfigImagery } from '../../config/imagery.js';
import { ConfigPrefix } from '../../index.js';
import { ConfigProviderDynamo } from '../dynamo.config.js';
const sandbox = sinon.createSandbox();

export function qkToNamedBounds(quadKeys: string[]): NamedBounds[] {
  const tms = TileMatrixSets.get(EpsgCode.Google);
  return quadKeys.map((qk) => ({
    name: TileMatrixSet.tileToName(QuadKey.toTile(qk)),
    ...tms.tileToSourceBounds(QuadKey.toTile(qk)),
  }));
}

o.spec('ConfigProvider.Imagery', () => {
  const provider = new ConfigProviderDynamo('Foo');

  o.beforeEach(() => {
    Config.setConfigProvider(provider);
  });

  o.afterEach(() => sandbox.restore());

  const item: ConfigImagery = { id: 'im_foo', name: 'abc' } as any;

  o('prefix', () => {
    o(Config.prefix(ConfigPrefix.Imagery, '1234')).equals('im_1234');
    o(Config.prefix(ConfigPrefix.Imagery, 'im_1234')).equals('im_1234');
    o(Config.prefix(ConfigPrefix.TileSet, '1234')).equals('ts_1234');
    o(Config.prefix(ConfigPrefix.TileSet, '')).equals('');
  });

  o('unprefix', () => {
    o(Config.unprefix(ConfigPrefix.Imagery, 'im_1234')).equals('1234');
    o(Config.unprefix(ConfigPrefix.Imagery, 'ts_1234')).equals('ts_1234');
    o(Config.unprefix(ConfigPrefix.Imagery, '1234')).equals('1234');
  });

  o('is', () => {
    o(Config.Imagery.is(item)).equals(true);
    o(Config.Imagery.is({ id: 'ts_foo' } as any)).equals(false);
    if (Config.Imagery.is(item)) {
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

    const result = await Config.getAllImagery(layers, Epsg.Google);
    o(get.callCount).equals(1);
    o([...get.firstCall.firstArg.keys()]).deepEquals(['im_foo1', 'im_foo2', 'im_foo4']);
    o(result.get('im_foo1')).deepEquals(item);
    o(result.get('im_foo2')).deepEquals(item);
    o(result.get('im_foo3')).equals(undefined);
    o(result.get('im_foo4')).deepEquals(item);
  });
});
