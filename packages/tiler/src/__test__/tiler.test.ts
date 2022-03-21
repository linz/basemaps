import { Bounds, GoogleTms, Nztm2000Tms, QuadKey } from '@basemaps/geo';
import { Approx, TestTiff } from '@basemaps/test';
import o from 'ospec';
import { Tiler } from '../tiler.js';

o.spec('tiler.test', () => {
  o.spec('getRasterTiffIntersection', () => {
    o('should intersect google', async () => {
      const tiff = await TestTiff.Google.init();
      const tiler = new Tiler(GoogleTms);

      const z0 = tiler.getRasterTiffIntersection(tiff, 0, 0, 0);
      Approx.bounds(z0?.tiff, { x: 64, y: 64, height: 128, width: 128 }, 'tiff');
      Approx.bounds(z0?.intersection, { x: 64, y: 64, height: 128, width: 128 }, 'intersection');
      Approx.bounds(z0?.tile, { x: 0, y: 0, width: 256, height: 256 }, 'tile');
    });

    ['0', '1', '2', '3'].forEach((qk) => {
      // Since this tiff centered in the middle tile, all of these tiffs should have 1/4 of their image taken up by it
      o(`should intersect google for qk:${qk}`, async () => {
        const tiff = await TestTiff.Google.init();
        const tiler = new Tiler(GoogleTms);

        const tile = QuadKey.toTile(qk);
        const o = tiler.getRasterTiffIntersection(tiff, tile.x, tile.y, tile.z);

        Approx.bounds(o?.tiff, { x: 128, y: 128, height: 256, width: 256 }, 'tiff');
        Approx.bounds(
          o?.intersection,
          { x: 128 + tile.x * 128, y: 128 + tile.y * 128, height: 128, width: 128 },
          'intersection',
        );
        Approx.bounds(o?.tile, { x: 256 * tile.x, y: 256 * tile.y, width: 256, height: 256 }, 'tile');
      });
    });
  });

  o('createComposition should handle non square images', () => {
    const tiler = new Tiler(Nztm2000Tms);

    const img = {
      id: 6,
      getTileBounds() {
        return { x: 0, y: 0, width: 512, height: 387 };
      },
      tif: { source: { name: '15-32295-20496.tiff' } },
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
      source: { x: 0, y: 0, imageId: 6, width: 512, height: 387 },
      y: 0,
      x: 64,
      extract: { width: 512, height: 387 },
      resize: { width: 256, height: 194, scale: 0.5 },
      crop,
    });

    o(crop?.toJson()).deepEquals(new Bounds(0, 64, 192, 130).toJson());
  });

  o('should clamp required tiles', () => {
    const bounds = new Bounds(0, 0, 1024, 1024);
    const tileCount = { x: 1, y: 1 };
    const tileSize = { width: 256, height: 256 };
    o(Array.from(Tiler.getRequiredTiles(bounds, 1, tileSize, tileCount))).deepEquals([{ x: 0, y: 0 }]);

    tileCount.y = 2;
    o(Array.from(Tiler.getRequiredTiles(bounds, 1, tileSize, tileCount))).deepEquals([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ]);
  });
});
