import { Epsg, EpsgCode, NamedBounds, QuadKey, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { ConfigImagery } from '../../config/imagery';
import { ConfigDynamo } from '../dynamo.config';

export function qkToNamedBounds(quadKeys: string[]): NamedBounds[] {
    const tms = TileMatrixSets.get(EpsgCode.Google);
    return quadKeys.map((qk) => ({
        name: TileMatrixSet.tileToName(QuadKey.toTile(qk)),
        ...tms.tileToSourceBounds(QuadKey.toTile(qk)),
    }));
}

o.spec('ConfigDynamoImagery', () => {
    const config = new ConfigDynamo('Foo');
    const sandbox = createSandbox();

    o.afterEach(() => sandbox.restore());

    const item: ConfigImagery = { id: 'im_foo', name: 'abc' } as any;

    o('is', () => {
        o(config.Imagery.is(item)).equals(true);
        o(config.Imagery.is({ id: 'ts_foo' } as any)).equals(false);
        if (config.Imagery.is(item)) {
            o(item.name).equals('abc'); // tests compiler
        }
    });

    o('Should get Imagery', async () => {
        const get = sandbox.stub(config.Imagery, 'get').resolves(item);

        const rule = { img2193: 'im_foo' } as any;
        const result = await config.Imagery.getImagery(rule, Epsg.Nztm2000);
        o(get.callCount).equals(1);
        o(get.firstCall.firstArg).equals('im_foo');
        o(result).deepEquals(item);
    });

    o('Should not get Imagery with wrong projection', async () => {
        const rule = { img2193: 'im_foo' } as any;
        const result = await config.Imagery.getImagery(rule, Epsg.Google);
        o(result).equals(null);
    });

    o('Should not get Imagery with no imgId', async () => {
        const rule = {} as any;
        const result = await config.Imagery.getImagery(rule, Epsg.Google);
        o(result).equals(null);
    });

    o('Should get all Imagery with correct order', async () => {
        const get = sandbox.stub(config.Imagery, 'get').resolves(item);

        const rules = [
            { img3857: 'im_foo1' },
            { img3857: 'im_foo2' },
            { img2193: 'im_foo3', img3857: 'im_foo4' },
        ] as any;

        const result = await config.Imagery.getAllImagery(rules, Epsg.Google);
        o(get.callCount).equals(3);
        o(get.firstCall.firstArg).equals('im_foo1');
        o(get.secondCall.firstArg).equals('im_foo2');
        o(get.thirdCall.firstArg).equals('im_foo4');
        o(result.size).deepEquals(3);
        const keys = Array.from(result.keys());
        o(keys[0]).equals('im_foo1');
        o(keys[1]).equals('im_foo2');
        o(keys[2]).equals('im_foo4');
        o(result.get('im_foo1')).deepEquals(item);
        o(result.get('im_foo2')).deepEquals(item);
        o(result.get('im_foo3')).equals(undefined);
        o(result.get('im_foo4')).deepEquals(item);
    });
});
