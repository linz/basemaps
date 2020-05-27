import { Bounds, Epsg, QuadKey } from '@basemaps/geo';
import { getTestingTiff, getTms } from '@basemaps/geo/build/__tests__/test.tiff';
import { BoundingBox } from '@cogeotiff/core/build/vector';
import * as o from 'ospec';
import { Tiler } from '../tiler';

export function approxEqual(numA: number | undefined, numB: number, text: string, variance = 0.001): void {
    if (numA == null) throw new Error(`${text} (${numA} vs ${numB})`);
    const diff = Math.abs(numA - numB);
    if (diff > variance) {
        throw new Error(`${text} (${numA} vs ${numB}) should be less than ${variance}`);
    }
}
function approxBounds(bounds: BoundingBox | undefined, expected: BoundingBox, name: string): void {
    approxEqual(bounds?.x, expected.x, `${name}_x`);
    approxEqual(bounds?.y, expected.y, `${name}_y`);
    approxEqual(bounds?.width, expected.width, `${name}_width`);
    approxEqual(bounds?.height, expected.height, `${name}_height`);
}

o.spec('tiler.test', () => {
    o.spec('getRasterTiffIntersection', () => {
        o('should intersect google', async () => {
            const tiff = await getTestingTiff(Epsg.Google);
            const tiler = new Tiler(getTms(Epsg.Google));

            const z0 = tiler.getRasterTiffIntersection(tiff, 0, 0, 0);
            approxBounds(z0?.tiff, { x: 64, y: 64, height: 128, width: 128 }, 'tiff');
            approxBounds(z0?.intersection, { x: 64, y: 64, height: 128, width: 128 }, 'intersection');
            approxBounds(z0?.tile, { x: 0, y: 0, width: 256, height: 256 }, 'tile');
        });

        ['0', '1', '2', '3'].forEach((qk) => {
            // Since this tiff centered in the middle tile, all of these tiffs should have 1/4 of their image taken up by it
            o(`should intersect google for qk:${qk}`, async () => {
                const tiff = await getTestingTiff(Epsg.Google);
                const tiler = new Tiler(getTms(Epsg.Google));

                const tile = QuadKey.toTile(qk);
                const o = tiler.getRasterTiffIntersection(tiff, tile.x, tile.y, tile.z);

                approxBounds(o?.tiff, { x: 128, y: 128, height: 256, width: 256 }, 'tiff');
                approxBounds(
                    o?.intersection,
                    { x: 128 + tile.x * 128, y: 128 + tile.y * 128, height: 128, width: 128 },
                    'intersection',
                );
                approxBounds(o?.tile, { x: 256 * tile.x, y: 256 * tile.y, width: 256, height: 256 }, 'tile');
            });
        });

        o.only('should intersect nztm', async () => {
            const tiff = await getTestingTiff(Epsg.Nztm2000);
            const tiler = new Tiler(getTms(Epsg.Nztm2000));

            console.log('data');
            const z0 = tiler.getRasterTiffIntersection(tiff, 0, 0, 0);
            console.log({ z0 });
        });
    });
    o('createComposition should handle non square images', () => {
        const tiler = new Tiler(getTms(Epsg.Nztm2000));

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
