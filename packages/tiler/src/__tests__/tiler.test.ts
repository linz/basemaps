import { Bounds, GoogleTms, Nztm2000QuadTms, QuadKey } from '@basemaps/geo';
import { Approx, TestTiff } from '@basemaps/test';
import o from 'ospec';
import { CompositionTiff } from '../raster.js';
import { Tiler } from '../tiler.js';

o.spec('tiler.test', () => {
  o.spec('getRasterTiffIntersection', () => {
    o('should intersect google', async () => {
      o.timeout(1_000);

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
        o.timeout(1_000);

        const tiff = await TestTiff.Google.init();
        const tiler = new Tiler(GoogleTms);

        const tile = QuadKey.toTile(qk);
        const intersection = tiler.getRasterTiffIntersection(tiff, tile.x, tile.y, tile.z);

        Approx.bounds(intersection?.tiff, { x: 128, y: 128, height: 256, width: 256 }, 'tiff');
        Approx.bounds(
          intersection?.intersection,
          { x: 128 + tile.x * 128, y: 128 + tile.y * 128, height: 128, width: 128 },
          'intersection',
        );
        Approx.bounds(intersection?.tile, { x: 256 * tile.x, y: 256 * tile.y, width: 256, height: 256 }, 'tile');
      });
    });
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

  o.spec('createComposition', () => {
    o('should handle non square images', () => {
      const img = {
        id: 6,
        getTileBounds() {
          return { x: 0, y: 0, width: 512, height: 388 };
        },
        tif: { source: { name: '15-32295-20496.tiff' } },
        tileSize: { width: 512, height: 512 },
      } as any;

      const intersections = {
        tiff: new Bounds(4133696, 2623424, 256, 192),
        intersection: new Bounds(4133696, 2623488, 192, 128),
        tile: new Bounds(4133632, 2623488, 256, 256),
      };

      const ans = Tiler.createComposition(img, 0, 0, 0.5, intersections) as CompositionTiff;
      if (ans == null) throw new Error('Composition should return results');
      const { crop } = ans;
      o(ans).deepEquals({
        type: 'tiff',
        asset: ans.asset,
        source: { x: 0, y: 0, imageId: 6, width: 512, height: 388 },
        y: 0,
        x: 64,
        extract: { width: 512, height: 388 },
        resize: { width: 256, height: 194, scaleX: 0.5, scaleY: 0.5 },
        crop,
      });

      o(crop).deepEquals(new Bounds(0, 64, 192, 130).toJson());
    });

    o('should compose with fraction scales', () => {
      const tile = { x: 126359, y: 137603, z: 18 };
      const screenPx = Nztm2000QuadTms.tileToPixels(tile.x, tile.y);
      const screenBoundsPx = new Bounds(screenPx.x, screenPx.y, Nztm2000QuadTms.tileSize, Nztm2000QuadTms.tileSize);

      const tiffBounds = new Bounds(32347190.62750788, 35224009.946296684, 1607.5978194959462, 2411.396729245782);
      const tileBounds = { x: 1024, y: 3584, width: 512, height: 16 };
      const intersections = {
        tiff: tiffBounds,
        intersection: tiffBounds.intersection(screenBoundsPx)!,
        tile: screenBoundsPx,
      };
      const img = {
        id: 6,
        getTileBounds: () => tileBounds,
        tif: { source: { name: '15-32295-20496.tiff' } },
        tileSize: { width: 512, height: 512 },
      } as any;
      const comp = Tiler.createComposition(img, 2, 7, 0.6698324247899835, intersections) as CompositionTiff;

      o(comp).deepEquals({
        type: 'tiff',
        asset: comp.asset,
        source: { x: 2, y: 7, imageId: 6, width: 512, height: 16 },
        y: 42,
        x: 0,
        resize: { width: 344, height: 344, scaleX: 0.671875, scaleY: 0.671875, scaleOverride: true },
        crop: { x: 28, y: 0, width: 256, height: 12 },
      });
    });
  });
});
