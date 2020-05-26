import { Bounds } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { BoundingBox } from '@cogeotiff/core/build/vector';
import * as o from 'ospec';
import { Tiler } from '../tiler';
import * as path from 'path';
import { CogSourceFile } from '@cogeotiff/source-file';

const TestData = path.join(__dirname, '../../../../test-data');

o.spec('tiler.test', () => {
    o.spec('getRasterTiffIntersection', () => {
        o.only('should intersect google', async () => {
            const tiff = await CogSourceFile.create(path.join(TestData, 'rgba8.google.tiff'));
            const tiler = new Tiler(GoogleTms);
            const targetZoom = 16;
            const targetTile = 2 ** 16 / 2;
            tiler.getRasterTiffIntersection(tiff, targetTile, targetTile, targetZoom);
        });

        o('should intersect nztm', () => {});
    });
    o('createComposition should handle non square images', () => {
        const tiler = new Tiler(GoogleTms);

        const img = {
            id: 6,
            getTileBounds(): BoundingBox {
                return { x: 0, y: 0, width: 512, height: 387 };
            },
            tif: { source: { name: '313111000120111.tiff' } },
            tileSize: { width: 512, height: 512 },
        } as any;

        const raster = {
            tiff: new Bounds(4133696, 2623424, 256, 192),
            intersection: new Bounds(4133696, 2623488, 192, 128),
            tile: new Bounds(4133632, 2623488, 256, 256),
        };

        const ans = tiler.createComposition(img, 0, 0, 0.5, raster);
        if (ans == null) throw new Error('Composition should return results');
        const { crop } = ans;
        o(ans).deepEquals({
            tiff: ans.tiff,
            source: { x: 0, y: 0, imageId: 6 },
            y: 0,
            x: 64,
            extract: { width: 512, height: 387 },
            resize: { width: 256, height: 194 },
            crop,
        });

        o(crop?.toJson()).deepEquals(new Bounds(0, 64, 192, 130).toJson());
    });
});
