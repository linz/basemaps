import { Bounds, QuadKey } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { Approx } from '@basemaps/test';
import { round } from '@basemaps/test/build/rounding';
import { BBox } from '@linzjs/geojson';
import o from 'ospec';
import { Projection } from '../projection';

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

o.spec('ProjectionTileMatrixSet', () => {
    o('getTiffResZoom', () => {
        o(Projection.getTiffResZoom(GoogleTms, 10)).equals(14);
        o(Projection.getTiffResZoom(GoogleTms, 10, 2)).equals(13);
        o(Projection.getTiffResZoom(GoogleTms, 0.075)).equals(21);

        o(Projection.getTiffResZoom(Nztm2000Tms, 10)).equals(10);
        o(Projection.getTiffResZoom(Nztm2000Tms, 10, 2)).equals(9);
        o(Projection.getTiffResZoom(Nztm2000Tms, 0.075)).equals(16);
    });

    o('getTileSize', async () => {
        o(Projection.getImagePixelWidth(GoogleTms, { x: 0, y: 0, z: 5 }, 10)).equals(16384);
        o(Projection.getImagePixelWidth(GoogleTms, { x: 0, y: 0, z: 13 }, 20)).equals(65536);

        o(Projection.getImagePixelWidth(Nztm2000Tms, { x: 0, y: 0, z: 5 }, 10)).equals(20480);
        o(Projection.getImagePixelWidth(Nztm2000Tms, { x: 0, y: 0, z: 13 }, 16)).equals(5120);
    });

    o('findAlignmentLevels', () => {
        o(Projection.findAlignmentLevels(GoogleTms, { x: 2, y: 0, z: 5 }, 0.075)).equals(15);
        o(Projection.findAlignmentLevels(GoogleTms, { x: 2, y: 0, z: 5 }, 0.5)).equals(13);
        o(Projection.findAlignmentLevels(GoogleTms, { x: 2, y: 0, z: 3 }, 1)).equals(14);
        o(Projection.findAlignmentLevels(GoogleTms, { x: 2, y: 0, z: 8 }, 10)).equals(5);
        o(Projection.findAlignmentLevels(GoogleTms, { x: 2, y: 0, z: 14 }, 10)).equals(0);

        o(Projection.findAlignmentLevels(Nztm2000Tms, { x: 2, y: 0, z: 1 }, 0.075)).equals(14);
        o(Projection.findAlignmentLevels(Nztm2000Tms, { x: 2, y: 0, z: 5 }, 0.5)).equals(8);
        o(Projection.findAlignmentLevels(Nztm2000Tms, { x: 2, y: 0, z: 3 }, 7)).equals(6);
        o(Projection.findAlignmentLevels(Nztm2000Tms, { x: 2, y: 0, z: 8 }, 14)).equals(0);
    });

    o('tileCenterToLatLon', () => {
        o(round(Projection.tileCenterToLatLon(GoogleTms, QuadKey.toTile('3120123')), 8)).deepEquals({
            lat: -47.98992167,
            lon: 105.46875,
        });
    });

    o.spec('tileToWgs84Bbox', () => {
        o('should handle antimeridian', () => {
            const pt = Projection.tileToWgs84Bbox(Nztm2000Tms, { x: 2, y: 1, z: 1 });

            o(round(pt)).deepEquals([170.05982382, -20.71836222, -179.34441046, -10.28396555]);
        });

        o('should convert base tiles', () => {
            const pt = Projection.tileToWgs84Bbox(GoogleTms, { x: 0, y: 0, z: 0 });
            o(round(pt)).deepEquals([-180, -85.05112878, 180, 85.05112878]);
        });
    });

    o.spec('TilingBounds', () => {
        // Approximate bounding box of new zealand
        const tifBoundingBox: BBox = [18494091.86765497, -6051366.655280836, 19986142.659781612, -4016307.214216303];
        const expectedBaseSize = Bounds.fromJson({ width: 9.53125, height: 13, y: 153.65625, x: 246.14062500000006 });

        o('should tile 0,0,0', () => {
            const bounds = getPixelsBoundsFromMeters(tifBoundingBox, 0);
            Approx.bounds(bounds, expectedBaseSize);

            const screenBounds = getPixelsFromTile(0, 0);
            const intersection = bounds.intersection(screenBounds);

            Approx.bounds(intersection, expectedBaseSize);
        });

        o('should tile 1,1,1', () => {
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
        o('should tile [15, 9, 4] & [15, 10, 4]', () => {
            const [x, z] = [15, 4];
            const bounds = getPixelsBoundsFromMeters(tifBoundingBox, z);
            const expectedBaseSizeScaled = expectedBaseSize.scale(2 ** z, 2 ** z);

            Approx.bounds(bounds, expectedBaseSizeScaled);

            const screenBounds9 = getPixelsFromTile(x, 9);
            const screenBounds10 = getPixelsFromTile(x, 10);
            o(screenBounds9.toJson()).deepEquals({ width: 256, height: 256, y: 2304, x: 3840 });
            o(screenBounds10.toJson()).deepEquals({ width: 256, height: 256, y: 2560, x: 3840 });

            const intersection9 = bounds.intersection(screenBounds9);
            const intersection10 = bounds.intersection(screenBounds10);
            if (intersection9 == null || intersection10 == null) {
                throw new Error('Intersections are null');
            }

            // the image is split in two so the intersection should combine into the total height of the image
            const totalIntersectionHeight = intersection9.height + intersection10.height;
            o(totalIntersectionHeight).equals(bounds.height);

            // The image is not split horizontally so the width should be the same for both intersections
            o(intersection9.width).equals(bounds.width);
            o(intersection10.width).equals(bounds.width);

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
        o('should tile [30, 19, 5], [31, 19, 5], [30, 20, 5], [31, 20, 5]', () => {
            const z = 5;

            const tileBounds = new Bounds(30, 19, 1, 1);
            const bounds = getPixelsBoundsFromMeters(tifBoundingBox, z);
            const expectedBaseSizeScaled = expectedBaseSize.scale(2 ** z, 2 ** z);

            Approx.bounds(bounds, expectedBaseSizeScaled);

            const screenTopLeft = getPixelsFromTile(tileBounds.x, tileBounds.y);
            const screenTopRight = getPixelsFromTile(tileBounds.right, tileBounds.y);

            o(screenTopLeft.toJson()).deepEquals({ width: 256, height: 256, y: 4864, x: 7680 });
            o(screenTopRight.toJson()).deepEquals({ width: 256, height: 256, y: 4864, x: 7936 });

            const intersectionTopLeft = bounds.intersection(screenTopLeft);
            const intersectionTopRight = bounds.intersection(screenTopRight);
            if (intersectionTopLeft == null || intersectionTopRight == null) {
                throw new Error('Intersections are null');
            }
            // the image is split in two so the intersection should combine into the total width of the image
            const totalTopIntersectionWidth = intersectionTopLeft.width + intersectionTopRight.width;
            o(totalTopIntersectionWidth).equals(bounds.width);
            o(intersectionTopLeft.height).equals(203);
            o(intersectionTopRight.height).equals(203);

            const screenBottomLeft = getPixelsFromTile(tileBounds.x, tileBounds.bottom);
            const screenBottomRight = getPixelsFromTile(tileBounds.right, tileBounds.bottom);

            o(screenBottomLeft.toJson()).deepEquals({ width: 256, height: 256, y: 5120, x: 7680 });
            o(screenBottomRight.toJson()).deepEquals({ width: 256, height: 256, y: 5120, x: 7936 });

            const intersectionBottomLeft = bounds.intersection(screenBottomLeft);
            const intersectionBottomRight = bounds.intersection(screenBottomRight);
            if (intersectionBottomLeft == null || intersectionBottomRight == null) {
                throw new Error('Bottom intersections are null');
            }
            // the image is split in two so the intersection should combine into the total width of the image
            const totalBottomIntersectionWidth = intersectionBottomLeft.width + intersectionBottomRight.width;
            o(totalBottomIntersectionWidth).equals(bounds.width);
            Approx.equal(intersectionBottomLeft.height, 213, 'height');
            Approx.equal(intersectionBottomRight.height, 213, 'height');

            const totalLeftIntersectionHeight = intersectionTopLeft.height + intersectionBottomLeft.height;
            const totalRightIntersectionHeight = intersectionTopRight.height + intersectionBottomRight.height;
            o(totalLeftIntersectionHeight).equals(bounds.height);
            o(totalRightIntersectionHeight).equals(bounds.height);
        });
    });
});
