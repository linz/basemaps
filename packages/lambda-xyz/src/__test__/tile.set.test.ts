import { Aws } from '@basemaps/lambda-shared';
import * as o from 'ospec';
import { TileSet } from '../tile.set';
import { EPSG } from '@basemaps/geo';

o.spec('tile.set', () => {
    const tsGet = Aws.tileMetadata.TileSet.get;
    const imGetAll = Aws.tileMetadata.Imagery.getAll;

    o.afterEach(() => {
        Aws.tileMetadata.TileSet.get = tsGet;
        Aws.tileMetadata.Imagery.getAll = imGetAll;
    });

    o('load', async () => {
        const now = Date.now();
        const tileSet = { updatedAt: now };

        const getSpy = o.spy(() => Object.assign({}, tileSet));
        const getAllSpy = o.spy();
        (Aws.tileMetadata.TileSet as any).get = getSpy;
        (Aws.tileMetadata.Imagery as any).getAll = getAllSpy;

        const ts = new TileSet('aerial', EPSG.Google, '');

        // first load
        await ts.load();
        o((ts as any).tileSet).deepEquals(tileSet);
        o(getAllSpy.callCount).equals(1);

        // load same
        await ts.load();
        o(getAllSpy.callCount).equals(1);

        // load new
        tileSet.updatedAt = now + 1;
        await ts.load();
        o(getAllSpy.callCount).equals(2);
        o((ts as any).tileSet).deepEquals(tileSet);
    });
});
