import { Epsg } from '@basemaps/geo';
import { TestTiff } from '@basemaps/test';
import { TileDataXyz, TileType } from '@basemaps/shared';
import { Composition, ImageFormat } from '@basemaps/tiler';
import o from 'ospec';
import { TileEtag } from '../routes/tile.etag';

o.spec('TileCacheKey', () => {
    const oldRenderId = TileEtag.RenderId;

    const xyzData: TileDataXyz = {
        x: 0,
        y: 0,
        z: 0,
        projection: Epsg.Google,
        name: 'foo',
        ext: ImageFormat.PNG,
        type: TileType.Image,
    };

    o.afterEach(() => {
        TileEtag.RenderId = oldRenderId;
    });

    o('should generate a cachekey', async () => {
        const tiff = await TestTiff.Google.init();
        const comp: Composition = {
            tiff,
            source: {
                x: 0,
                y: 0,
                imageId: 0,
            },
            x: 5,
            y: 5,
        };
        const firstKey = TileEtag.generate([comp], xyzData);
        o(firstKey).equals('Dq7/fLeUBmd4Ga6W5DlkD95ZsgmkYAyDtMJi/PM/BVg=');
        // Different layers should generate different keys
        o(TileEtag.generate([comp, comp], xyzData)).notEquals(firstKey);

        // Different projections should generate different keys
        xyzData.projection = Epsg.Nztm2000;
        o(TileEtag.generate([comp], xyzData)).notEquals(firstKey);
    });

    o('should change if the renderId changes', () => {
        const keyA = TileEtag.generate([], {} as any);
        TileEtag.RenderId = 2;
        const KeyB = TileEtag.generate([], {} as any);
        o(keyA).notEquals(KeyB);
    });
});
