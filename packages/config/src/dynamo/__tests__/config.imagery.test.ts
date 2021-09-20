import { Epsg, EpsgCode, NamedBounds, QuadKey, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import o from 'ospec';
import sinon from 'sinon';
import { Config } from '../../base.config.js';
import { ConfigImagery } from '../../config/imagery.js';
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

  o('is', () => {
    o(Config.Imagery.is(item)).equals(true);
    o(Config.Imagery.is({ id: 'ts_foo' } as any)).equals(false);
    if (Config.Imagery.is(item)) {
      o(item.name).equals('abc'); // tests compiler
    }
  });

  o('Should get Imagery', async () => {
    const get = sandbox.stub(provider.Imagery, 'get').resolves(item);

    const layer = { [2193]: 'foo' } as any;
    const result = await Config.getImagery(layer, Epsg.Nztm2000);
    o(get.callCount).equals(1);
    o(get.firstCall.firstArg).equals('im_foo');
    o(result).deepEquals(item);
  });

  o('Should not get Imagery with wrong projection', async () => {
    const layer = { [2193]: 'foo' } as any;
    const result = await Config.getImagery(layer, Epsg.Google);
    o(result).equals(null);
  });

  o('Should not get Imagery with no imgId', async () => {
    const rule = {} as any;
    const result = await Config.getImagery(rule, Epsg.Google);
    o(result).equals(null);
  });

  o('Should get all Imagery with correct order', async () => {
    const get = sandbox.stub(provider.Imagery, 'get').resolves(item);

    const layers = [{ [3857]: 'foo1' }, { [3857]: 'foo2' }, { [2193]: 'foo3', [3857]: 'foo4' }] as any;

    const result = await Config.getAllImagery(layers, Epsg.Google);
    o(get.callCount).equals(3);
    o(get.firstCall.firstArg).equals('im_foo1');
    o(get.secondCall.firstArg).equals('im_foo2');
    o(get.thirdCall.firstArg).equals('im_foo4');
    o(result.size).deepEquals(3);
    const keys = Array.from(result.keys());
    o(keys[0]).equals('foo1');
    o(keys[1]).equals('foo2');
    o(keys[2]).equals('foo4');
    o(result.get('foo1')).deepEquals(item);
    o(result.get('foo2')).deepEquals(item);
    o(result.get('foo3')).equals(undefined);
    o(result.get('foo4')).deepEquals(item);
  });
});
