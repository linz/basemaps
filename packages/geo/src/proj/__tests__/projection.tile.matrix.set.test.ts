import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Approx } from '@basemaps/test';
import { round } from '@basemaps/test/build/rounding.js';
import { BBox } from '@linzjs/geojson';

import { Bounds } from '../../bounds.js';
import { QuadKey } from '../../quad.key.js';
import { GoogleTms } from '../../tms/google.js';
import { Nztm2000QuadTms, Nztm2000Tms } from '../../tms/nztm2000.js';
import { LatLon, Projection } from '../projection.js';

const TileSize = 256;

/**
 * Get the raster bounds for a WebMercator zoom level
 *
 * @param extent Extent in meters in the format of [minX,minY,maxX,maxY]
 * @param zoom Web mercator zoom level
 */
function getPixelsBoundsFromMeters(extent: BBox, zoom: number): Bounds {
  const upperLeftMeters = GoogleTms.sourceToPixels(extent[0], extent[3], zoom);
  const lowerRightMeters = GoogleTms.sourceToPixels(extent[2], extent[1], zoom);
  return Bounds.fromUpperLeftLowerRight(upperLeftMeters, lowerRightMeters);
}

/** Convert a XYZ tile into a screen bounding box */
function getPixelsFromTile(x: number, y: number): Bounds {
  return new Bounds(x * TileSize, y * TileSize, TileSize, TileSize);
}

function isValidLatLong(x: LatLon): void {
  assert.equal(x.lat <= 90, true, `lat: ${x.lat} <= 90`);
  assert.equal(x.lat >= -90, true, `lat: ${x.lat} >= -90`);

  assert.equal(x.lon <= 180, true, `lon: ${x.lon} <= 180`);
  assert.equal(x.lon >= -180, true, `lon: ${x.lon} >= -180`);
}

describe('ProjectionTileMatrixSet', () => {
  it('getTiffResZoom', () => {
    assert.equal(Projection.getTiffResZoom(GoogleTms, 10), 14);
    assert.equal(Projection.getTiffResZoom(GoogleTms, 10 * 2), 13);
    assert.equal(Projection.getTiffResZoom(GoogleTms, 0.075), 21);
    assert.equal(Projection.getTiffResZoom(Nztm2000Tms, 10), 10);
    assert.equal(Projection.getTiffResZoom(Nztm2000Tms, 10 * 2), 9);
    assert.equal(Projection.getTiffResZoom(Nztm2000Tms, 0.075), 16);
  });

  [Nztm2000QuadTms, GoogleTms].forEach((tms) => {
    it(`should getTiffResZoom when floating errors happen (${tms.identifier})`, () => {
      // Shift the resolution  by a very small amount
      const shiftAmount = 1e-9;
      for (let i = 0; i < tms.maxZoom; i++) {
        assert.equal(Projection.getTiffResZoom(tms, tms.pixelScale(i) - shiftAmount), i);
        assert.equal(Projection.getTiffResZoom(tms, tms.pixelScale(i) + shiftAmount), i);
      }
    });
  });

  it('getTileSize', () => {
    assert.equal(Projection.getImagePixelWidth(GoogleTms, { x: 0, y: 0, z: 5 }, 10), 16384);
    assert.equal(Projection.getImagePixelWidth(GoogleTms, { x: 0, y: 0, z: 13 }, 20), 65536);

    assert.equal(Projection.getImagePixelWidth(Nztm2000Tms, { x: 0, y: 0, z: 5 }, 10), 20480);
    assert.equal(Projection.getImagePixelWidth(Nztm2000Tms, { x: 0, y: 0, z: 13 }, 16), 5120);
  });

  it('findAlignmentLevels', () => {
    assert.equal(Projection.findAlignmentLevels(GoogleTms, { x: 2, y: 0, z: 5 }, 0.075), 15);
    assert.equal(Projection.findAlignmentLevels(GoogleTms, { x: 2, y: 0, z: 5 }, 0.5), 13);
    assert.equal(Projection.findAlignmentLevels(GoogleTms, { x: 2, y: 0, z: 3 }, 1), 14);
    assert.equal(Projection.findAlignmentLevels(GoogleTms, { x: 2, y: 0, z: 8 }, 10), 5);
    assert.equal(Projection.findAlignmentLevels(GoogleTms, { x: 2, y: 0, z: 14 }, 10), 0);

    assert.equal(Projection.findAlignmentLevels(Nztm2000Tms, { x: 2, y: 0, z: 1 }, 0.075), 14);
    assert.equal(Projection.findAlignmentLevels(Nztm2000Tms, { x: 2, y: 0, z: 5 }, 0.5), 8);
    assert.equal(Projection.findAlignmentLevels(Nztm2000Tms, { x: 2, y: 0, z: 3 }, 7), 6);
    assert.equal(Projection.findAlignmentLevels(Nztm2000Tms, { x: 2, y: 0, z: 8 }, 14), 0);
  });

  describe('tileCenterToLatLon', () => {
    it('should create centers for web mercator', () => {
      const center = Projection.tileCenterToLatLon(GoogleTms, QuadKey.toTile('3120123'));
      isValidLatLong(center);
      assert.deepEqual(round(center, 6), {
        lat: -47.989922,
        lon: 105.46875,
      });
    });
    it('should create centers for NZTM', () => {
      const center = Projection.tileCenterToLatLon(Nztm2000Tms, { x: 2295, y: 5119, z: 10 });
      isValidLatLong(center);

      const centerB = Projection.tileCenterToLatLon(Nztm2000Tms, { x: 20, y: 20, z: 10 });
      isValidLatLong(centerB);
    });
    it('should create centers for NZTMQuad', () => {
      const center = Projection.tileCenterToLatLon(Nztm2000QuadTms, { x: 200, y: 500, z: 10 });
      isValidLatLong(center);
      assert.deepEqual(round(center, 7), { lat: -35.7940688, lon: 141.3785792 });

      const centerB = Projection.tileCenterToLatLon(Nztm2000QuadTms, { x: 1000, y: 1000, z: 10 });
      isValidLatLong(centerB);
    });
  });
  describe('wrapLatLon', () => {
    it('should wrap longitude', () => {
      assert.deepEqual(Projection.wrapLatLon(0, 1), { lat: 0, lon: 1 });
      assert.deepEqual(Projection.wrapLatLon(0, 181), { lat: 0, lon: -179 });
      assert.deepEqual(Projection.wrapLatLon(0, 271), { lat: 0, lon: -89 });
      assert.deepEqual(Projection.wrapLatLon(0, 361), { lat: 0, lon: 1 });
      assert.deepEqual(Projection.wrapLatLon(0, 631), { lat: 0, lon: -89 });
      assert.deepEqual(Projection.wrapLatLon(0, 721), { lat: 0, lon: 1 });

      assert.deepEqual(Projection.wrapLatLon(0, -1), { lat: 0, lon: -1 });
      assert.deepEqual(Projection.wrapLatLon(0, -181), { lat: 0, lon: 179 });
      assert.deepEqual(Projection.wrapLatLon(0, -271), { lat: 0, lon: 89 });
      assert.deepEqual(Projection.wrapLatLon(0, -361), { lat: 0, lon: -1 });
      assert.deepEqual(Projection.wrapLatLon(0, -631), { lat: 0, lon: 89 });
      assert.deepEqual(Projection.wrapLatLon(0, -721), { lat: 0, lon: -1 });
    });

    it('should wrap latitude', () => {
      assert.deepEqual(Projection.wrapLatLon(1, 0), { lat: 1, lon: 0 });
      assert.deepEqual(Projection.wrapLatLon(91, 0), { lat: 89, lon: 180 });
      assert.deepEqual(Projection.wrapLatLon(181, 0), { lat: -1, lon: 180 });
      assert.deepEqual(Projection.wrapLatLon(271, 0), { lat: -89, lon: 0 });
      assert.deepEqual(Projection.wrapLatLon(361, 0), { lat: 1, lon: 0 });
      assert.deepEqual(Projection.wrapLatLon(631, 0), { lat: -89, lon: 0 });
      assert.deepEqual(Projection.wrapLatLon(721, 0), { lat: 1, lon: 0 });

      assert.deepEqual(Projection.wrapLatLon(-1, 0), { lat: -1, lon: 0 });
      assert.deepEqual(Projection.wrapLatLon(-91, 0), { lat: -89, lon: 180 });
      assert.deepEqual(Projection.wrapLatLon(-181, 0), { lat: 1, lon: 180 });
      assert.deepEqual(Projection.wrapLatLon(-271, 0), { lat: 89, lon: 0 });
      assert.deepEqual(Projection.wrapLatLon(-361, 0), { lat: -1, lon: 0 });
      assert.deepEqual(Projection.wrapLatLon(-631, 0), { lat: 89, lon: 0 });
      assert.deepEqual(Projection.wrapLatLon(-721, 0), { lat: -1, lon: 0 });
    });
  });

  describe('tileToWgs84Bbox', () => {
    it('should handle antimeridian', () => {
      const pt = Projection.tileToWgs84Bbox(Nztm2000Tms, { x: 2, y: 1, z: 1 });

      assert.deepEqual(round(pt), [170.05982382, -20.71836222, -179.34441047, -10.28396555]);
    });

    it('should convert base tiles', () => {
      const pt = Projection.tileToWgs84Bbox(GoogleTms, { x: 0, y: 0, z: 0 });
      assert.deepEqual(round(pt), [-180, -85.05112878, 180, 85.05112878]);
    });
  });

  describe('TilingBounds', () => {
    // Approximate bounding box of new zealand
    const tifBoundingBox: BBox = [18494091.86765497, -6051366.655280836, 19986142.659781612, -4016307.214216303];
    const expectedBaseSize = Bounds.fromJson({ width: 9.53125, height: 13, y: 153.65625, x: 246.14062500000006 });

    it('should tile 0,0,0', () => {
      const bounds = getPixelsBoundsFromMeters(tifBoundingBox, 0);
      Approx.bounds(bounds, expectedBaseSize);

      const screenBounds = getPixelsFromTile(0, 0);
      const intersection = bounds.intersection(screenBounds);

      Approx.bounds(intersection, expectedBaseSize);
    });

    it('should tile 1,1,1', () => {
      const [x, y, z] = [1, 1, 1];
      const bounds = getPixelsBoundsFromMeters(tifBoundingBox, z);
      const expectedBaseSizeScaled = expectedBaseSize.scale(2, 2);

      Approx.bounds(bounds, expectedBaseSizeScaled);

      const screenBounds = getPixelsFromTile(x, y);
      const intersection = bounds.intersection(screenBounds);

      Approx.bounds(intersection, expectedBaseSizeScaled);
    });

    /**
     * XYZ tiles 15,9,4 & 15,10,4 provide a top/bottom tiles for this bounding box
     *
     *     15
     *  |-------|
     *  |  XXX  | 9
     *  |-------|
     *  |  XXX  | 10
     *  |-------|
     */
    it('should tile [15, 9, 4] & [15, 10, 4]', () => {
      const [x, z] = [15, 4];
      const bounds = getPixelsBoundsFromMeters(tifBoundingBox, z);
      const expectedBaseSizeScaled = expectedBaseSize.scale(2 ** z, 2 ** z);

      Approx.bounds(bounds, expectedBaseSizeScaled);

      const screenBounds9 = getPixelsFromTile(x, 9);
      const screenBounds10 = getPixelsFromTile(x, 10);
      assert.deepEqual(screenBounds9.toJson(), { width: 256, height: 256, y: 2304, x: 3840 });
      assert.deepEqual(screenBounds10.toJson(), { width: 256, height: 256, y: 2560, x: 3840 });

      const intersection9 = bounds.intersection(screenBounds9);
      const intersection10 = bounds.intersection(screenBounds10);
      if (intersection9 == null || intersection10 == null) {
        throw new Error('Intersections are null');
      }

      // the image is split in two so the intersection should combine into the total height of the image
      const totalIntersectionHeight = intersection9.height + intersection10.height;
      assert.equal(totalIntersectionHeight, bounds.height);

      // The image is not split horizontally so the width should be the same for both intersections
      assert.equal(intersection9.width, bounds.width);
      assert.equal(intersection10.width, bounds.width);

      Approx.equal(intersection9.height, 101.5, 'height');
      Approx.equal(intersection10.height, 106.5, 'height');
    });

    /**
     * XYZ tiles [30, 19, 5], [31, 19, 5], [30, 20, 5], [31, 20, 5]
     * provide a top, bottom, left & right tiles for this bounding box
     *
     *      30      31
     *  |-------|-------|
     *  |  XXXXX|XXXX   | 19
     *  |-------|-------|
     *  |  XXXXX|XXXX   | 20
     *  |-------|-------|
     */
    it('should tile [30, 19, 5], [31, 19, 5], [30, 20, 5], [31, 20, 5]', () => {
      const z = 5;

      const tileBounds = new Bounds(30, 19, 1, 1);
      const bounds = getPixelsBoundsFromMeters(tifBoundingBox, z);
      const expectedBaseSizeScaled = expectedBaseSize.scale(2 ** z, 2 ** z);

      Approx.bounds(bounds, expectedBaseSizeScaled);

      const screenTopLeft = getPixelsFromTile(tileBounds.x, tileBounds.y);
      const screenTopRight = getPixelsFromTile(tileBounds.right, tileBounds.y);

      assert.deepEqual(screenTopLeft.toJson(), { width: 256, height: 256, y: 4864, x: 7680 });
      assert.deepEqual(screenTopRight.toJson(), { width: 256, height: 256, y: 4864, x: 7936 });

      const intersectionTopLeft = bounds.intersection(screenTopLeft);
      const intersectionTopRight = bounds.intersection(screenTopRight);
      if (intersectionTopLeft == null || intersectionTopRight == null) {
        throw new Error('Intersections are null');
      }
      // the image is split in two so the intersection should combine into the total width of the image
      const totalTopIntersectionWidth = intersectionTopLeft.width + intersectionTopRight.width;
      assert.equal(totalTopIntersectionWidth, bounds.width);
      assert.equal(intersectionTopLeft.height, 203);
      assert.equal(intersectionTopRight.height, 203);

      const screenBottomLeft = getPixelsFromTile(tileBounds.x, tileBounds.bottom);
      const screenBottomRight = getPixelsFromTile(tileBounds.right, tileBounds.bottom);

      assert.deepEqual(screenBottomLeft.toJson(), { width: 256, height: 256, y: 5120, x: 7680 });
      assert.deepEqual(screenBottomRight.toJson(), { width: 256, height: 256, y: 5120, x: 7936 });

      const intersectionBottomLeft = bounds.intersection(screenBottomLeft);
      const intersectionBottomRight = bounds.intersection(screenBottomRight);
      if (intersectionBottomLeft == null || intersectionBottomRight == null) {
        throw new Error('Bottom intersections are null');
      }
      // the image is split in two so the intersection should combine into the total width of the image
      const totalBottomIntersectionWidth = intersectionBottomLeft.width + intersectionBottomRight.width;
      assert.equal(totalBottomIntersectionWidth, bounds.width);
      Approx.equal(intersectionBottomLeft.height, 213, 'height');
      Approx.equal(intersectionBottomRight.height, 213, 'height');

      const totalLeftIntersectionHeight = intersectionTopLeft.height + intersectionBottomLeft.height;
      const totalRightIntersectionHeight = intersectionTopRight.height + intersectionBottomRight.height;
      assert.equal(totalLeftIntersectionHeight, bounds.height);
      assert.equal(totalRightIntersectionHeight, bounds.height);
    });
  });
});
