import { Bounds } from '../bounds';
import { Projection } from '../projection';

export function approxEqual(numA: number, numB: number, text: string, variance = 0.001): void {
    const diff = Math.abs(numA - numB);
    if (diff > variance) {
        throw new Error(`${text} (${numA} vs ${numB}) should be less than ${variance}`);
    }
}
export function approxBounds(boundsA: Bounds | null, boundsB: Bounds | null): void {
    if (boundsA == null) {
        throw new Error('BoundsA is null');
    }
    if (boundsB == null) {
        throw new Error('BoundsB is null');
    }
    approxEqual(boundsA.width, boundsB.width, 'width');
    approxEqual(boundsA.height, boundsB.height, 'height');
    approxEqual(boundsA.y, boundsB.y, 'top');
    approxEqual(boundsA.x, boundsB.x, 'left');
}

describe('TilingBounds', () => {
    const projection = new Projection(256);
    // Approximate bounding box of new zealand
    const tifBoundingBox: [number, number, number, number] = [
        18494091.86765497,
        -6051366.655280836,
        19986142.659781612,
        -4016307.214216303,
    ];
    const expectedBaseSize = Bounds.fromJson({ width: 9.53125, height: 13, y: 153.65625, x: 246.14062500000006 });

    it('should tile 0,0,0', () => {
        const bounds = projection.getPixelsBoundsFromMeters(tifBoundingBox, 0);
        approxBounds(bounds, expectedBaseSize);

        const screenBounds = projection.getPixelsFromTile(0, 0);
        const intersection = bounds.intersection(screenBounds);

        approxBounds(intersection, expectedBaseSize);
    });

    it('should tile 1,1,1', () => {
        const [x, y, z] = [1, 1, 1];
        const bounds = projection.getPixelsBoundsFromMeters(tifBoundingBox, z);
        const expectedBaseSizeScaled = expectedBaseSize.scale(2, 2);

        approxBounds(bounds, expectedBaseSizeScaled);

        const screenBounds = projection.getPixelsFromTile(x, y);
        const intersection = bounds.intersection(screenBounds);

        approxBounds(intersection, expectedBaseSizeScaled);
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
        const bounds = projection.getPixelsBoundsFromMeters(tifBoundingBox, z);
        const expectedBaseSizeScaled = expectedBaseSize.scale(2 ** z, 2 ** z);

        approxBounds(bounds, expectedBaseSizeScaled);

        const screenBounds9 = projection.getPixelsFromTile(x, 9);
        const screenBounds10 = projection.getPixelsFromTile(x, 10);
        expect(screenBounds9.toJson()).toEqual({ width: 256, height: 256, y: 2304, x: 3840 });
        expect(screenBounds10.toJson()).toEqual({ width: 256, height: 256, y: 2560, x: 3840 });

        const intersection9 = bounds.intersection(screenBounds9);
        const intersection10 = bounds.intersection(screenBounds10);
        if (intersection9 == null || intersection10 == null) {
            throw new Error('Intersections are null');
        }

        // the image is split in two so the intersection should combine into the total height of the image
        const totalIntersectionHeight = intersection9.height + intersection10.height;
        expect(totalIntersectionHeight).toEqual(bounds.height);

        // The image is not split horizontally so the width should be the same for both intersections
        expect(intersection9.width).toEqual(bounds.width);
        expect(intersection10.width).toEqual(bounds.width);

        approxEqual(intersection9.height, 101.5, 'height');
        approxEqual(intersection10.height, 106.5, 'height');
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
        const bounds = projection.getPixelsBoundsFromMeters(tifBoundingBox, z);
        const expectedBaseSizeScaled = expectedBaseSize.scale(2 ** z, 2 ** z);

        approxBounds(bounds, expectedBaseSizeScaled);

        const screenTopLeft = projection.getPixelsFromTile(tileBounds.x, tileBounds.y);
        const screenTopRight = projection.getPixelsFromTile(tileBounds.right, tileBounds.y);

        expect(screenTopLeft.toJson()).toEqual({ width: 256, height: 256, y: 4864, x: 7680 });
        expect(screenTopRight.toJson()).toEqual({ width: 256, height: 256, y: 4864, x: 7936 });

        const intersectionTopLeft = bounds.intersection(screenTopLeft);
        const intersectionTopRight = bounds.intersection(screenTopRight);
        if (intersectionTopLeft == null || intersectionTopRight == null) {
            throw new Error('Intersections are null');
        }
        // the image is split in two so the intersection should combine into the total width of the image
        const totalTopIntersectionWidth = intersectionTopLeft.width + intersectionTopRight.width;
        expect(totalTopIntersectionWidth).toEqual(bounds.width);
        expect(intersectionTopLeft.height).toEqual(203);
        expect(intersectionTopRight.height).toEqual(203);

        const screenBottomLeft = projection.getPixelsFromTile(tileBounds.x, tileBounds.bottom);
        const screenBottomRight = projection.getPixelsFromTile(tileBounds.right, tileBounds.bottom);

        expect(screenBottomLeft.toJson()).toEqual({ width: 256, height: 256, y: 5120, x: 7680 });
        expect(screenBottomRight.toJson()).toEqual({ width: 256, height: 256, y: 5120, x: 7936 });

        const intersectionBottomLeft = bounds.intersection(screenBottomLeft);
        const intersectionBottomRight = bounds.intersection(screenBottomRight);
        if (intersectionBottomLeft == null || intersectionBottomRight == null) {
            throw new Error('Bottom intersections are null');
        }
        // the image is split in two so the intersection should combine into the total width of the image
        const totalBottomIntersectionWidth = intersectionBottomLeft.width + intersectionBottomRight.width;
        expect(totalBottomIntersectionWidth).toEqual(bounds.width);
        approxEqual(intersectionBottomLeft.height, 213, 'height');
        approxEqual(intersectionBottomRight.height, 213, 'height');

        const totalLeftIntersectionHeight = intersectionTopLeft.height + intersectionBottomLeft.height;
        const totalRightIntersectionHeight = intersectionTopRight.height + intersectionBottomRight.height;
        expect(totalLeftIntersectionHeight).toEqual(bounds.height);
        expect(totalRightIntersectionHeight).toEqual(bounds.height);
    });
});
