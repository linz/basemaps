import { TileEtag } from '../routes/tile.etag';
import * as o from 'ospec';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceFile } from '@cogeotiff/source-file';
import { Composition, ImageFormat } from '@basemaps/tiler';
import { TileType, TileDataXyz } from '@basemaps/lambda-shared';
import * as path from 'path';
import { Epsg } from '@basemaps/geo';

o.spec('TileCacheKey', () => {
    const oldRenderId = TileEtag.RenderId;
    const tiffPath = path.join(__dirname, '../../../../test-data/rgba8_tiled.wm.tiff');
    const tiff = new CogTiff(new CogSourceFile(tiffPath));
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
        await tiff.init();
        const firstKey = TileEtag.generate([comp], xyzData);
        o(firstKey).equals('x7KKkey4OM44DM57j7dAhrakQQEqQkCPJFzb7yJMYNU=');
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
