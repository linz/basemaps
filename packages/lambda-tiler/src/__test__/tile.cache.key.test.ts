import { GoogleTms, Nztm2000Tms } from '@basemaps/geo';
import { TileDataXyz, TileType } from '@basemaps/shared';
import { TestTiff } from '@basemaps/test';
import { Composition, ImageFormat } from '@basemaps/tiler';
import o from 'ospec';
import { TileEtag } from '../routes/tile.etag';

o.spec('TileCacheKey', () => {
    const oldRenderId = TileEtag.RenderId;

    const xyzData: TileDataXyz = {
        x: 0,
        y: 0,
        z: 0,
        tileMatrix: GoogleTms,
        name: 'foo',
        ext: ImageFormat.PNG,
        type: TileType.Tile,
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
                width: 512,
                height: 512,
            },
            x: 5,
            y: 5,
        };
        const firstKey = TileEtag.generate([comp], xyzData);
        o(firstKey).equals('8eJ7XnUeEGBI2d7mfAaK5o8KbUc0+CVaIoPzqCvkoDk=');

        // Different layers should generate different keys
        o(TileEtag.generate([comp, comp], xyzData)).notEquals(firstKey);

        // Different projections should generate different keys
        xyzData.tileMatrix = Nztm2000Tms;
        o(TileEtag.generate([comp], xyzData)).notEquals(firstKey);
    });

    o('should change if the renderId changes', () => {
        const keyA = TileEtag.generate([], { tileMatrix: {} } as any);
        TileEtag.RenderId = 2;
        const KeyB = TileEtag.generate([], { tileMatrix: {} } as any);
        o(keyA).notEquals(KeyB);
    });
});
