export interface Point {
    x: number;
    y: number;
}
export interface Size {
    width: number;
    height: number;
}

export interface BoundingBox extends Point, Size {}

export class Bounds implements BoundingBox {
    public readonly x: number;
    public readonly y: number;
    public readonly width: number;
    public readonly height: number;

    public constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /** Calculate the bottom point as y + height */
    public get bottom(): number {
        return this.y + this.height;
    }

    /** Calculate right point as x + width */
    public get right(): number {
        return this.x + this.width;
    }

    /**
     * Does this bounds intersect another bounds
     *
     * @param other Bounds to check intersection with
     */
    public intersects(other: Bounds): boolean {
        return this.x < other.right && other.x < this.right && this.y < other.bottom && other.y < this.bottom;
    }

    /**
     * Is `other` bounds completely within this bounds

     * @param other Bounds to check is within this
     */
    public containsBounds(other: Bounds): boolean {
        return Bounds.contains(this, other);
    }

    /**
     * Create a new bounds that is the intersection of the two bounds (if any))
     *
     * @param other Bounds to calculate intersection with

     * @returns new Bounds that is the intersection of the two bounds or null is not intersection
     * found
     */
    public intersection(other: Bounds): Bounds | null {
        const x = Math.max(this.x, other.x);
        const num1 = Math.min(this.x + this.width, other.x + other.width);
        const y = Math.max(this.y, other.y);
        const num2 = Math.min(this.y + this.height, other.y + other.height);

        if (num1 > x && num2 > y) {
            return new Bounds(x, y, num1 - x, num2 - y);
        }
        return null;
    }

    /**
     * Get the union of a `list` of Bounds
     */
    public static union(list: BoundingBox[]): Bounds {
        if (list.length == 0) throw new Error('Union on empty list is not allowed');

        let { x, y } = list[0];
        let maxX = x + list[0].width;
        let maxY = y + list[0].height;

        for (let i = 1; i < list.length; ++i) {
            const other = list[i];
            x = Math.min(x, other.x);
            maxX = Math.max(maxX, other.x + other.width);
            y = Math.min(y, other.y);
            maxY = Math.max(maxY, other.y + other.height);
        }

        return new Bounds(x, y, maxX - x, maxY - y);
    }

    /**
     * Create a new bounds that is the union of the two bounds
     *
     * @param other Bounds to calculate union with
     */
    public union(other: Bounds): Bounds {
        return Bounds.union([this, other]);
    }

    /**
     * Convert to JSON
     */
    public toJson(): BoundingBox {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    /**
     * Convert to BBox
     */
    public toBbox(): [number, number, number, number] {
        return [this.x, this.y, this.right, this.bottom];
    }

    /**
     * Convert to GeoJson Polygon coordinates
     */
    public toPolygon(): [number, number][][] {
        return [
            [
                [this.x, this.y],
                [this.x, this.bottom],
                [this.right, this.bottom],
                [this.right, this.y],
                [this.x, this.y],
            ],
        ];
    }

    /**
     * Scale the bounding box adjusting top, left, width & height
     *
     * @param scaleX scale x parameters (left, width)
     * @param scaleY scale of y parameters (top, height)
     * @returns new bounds that has been scaled
     */
    public scale(scaleX: number, scaleY: number = scaleX): Bounds {
        return new Bounds(this.x * scaleX, this.y * scaleY, this.width * scaleX, this.height * scaleY);
    }

    /**
     * Scale by a factor about center
     * @param scaleX scale of x parameters (left, width)
     * @param scaleY scale of y parameters (top, height)
     */
    public scaleFromCenter(scaleX: number, scaleY: number = scaleX): Bounds {
        const newWidth = this.width * scaleX;
        const newHeight = this.height * scaleY;
        return new Bounds(
            this.x - 0.5 * (newWidth - this.width),
            this.y - 0.5 * (newHeight - this.height),
            newWidth,
            newHeight,
        );
    }

    /**
     * Round dimensions to integers keeping the error a low as possible
     */
    public round(): Bounds {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        return new Bounds(x, y, Math.round(this.right) - x, Math.round(this.bottom) - y);
    }

    public add(bounds: Point): Bounds {
        return new Bounds(this.x + bounds.x, this.y + bounds.y, this.width, this.height);
    }

    public subtract(bounds: Point): Bounds {
        return new Bounds(this.x - bounds.x, this.y - bounds.y, this.width, this.height);
    }

    /**
     * Find the bounds of a MultiPolygon.
     * Does not work with WGS84 when crosses antimeridian.

     * @param multipoly the polygon to measure
     */
    public static fromMultiPolygon(multipoly: number[][][][]): Bounds {
        if (multipoly.length == 0) return new Bounds(0, 0, 0, 0);
        let minX = multipoly[0][0][0][0];
        let minY = multipoly[0][0][0][1];
        let maxX = minX;
        let maxY = minY;
        for (const [poly] of multipoly) {
            for (const [x, y] of poly) {
                if (x < minX) minX = x;
                else if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                else if (y > maxY) maxY = y;
            }
        }

        return new Bounds(minX, minY, maxX - minX, maxY - minY);
    }

    /**
     * Convert a BBox(minX, minY, maxX, maxY) to Bounds(x,y, width, height).
     * Does not work with WGS84 when crosses the antimeridian.
     * @param bbox
     */
    public static fromBbox([x1, y1, x2, y2]: number[]): Bounds {
        return new Bounds(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    }

    /** Convert a pair of upper left `ul` and lower right `lr` Points to Bounds */
    public static fromUpperLeftLowerRight(ul: Point, lr: Point): Bounds {
        return new Bounds(ul.x, ul.y, lr.x - ul.x, lr.y - ul.y);
    }

    public static fromJson(bounds: BoundingBox): Bounds {
        return new Bounds(bounds.x, bounds.y, bounds.width, bounds.height);
    }

    /**
     * Use for sorting Bounding boxes by area, x, y
     */
    public static compareArea(a: BoundingBox, b: BoundingBox): number {
        const areaDiff = a.width * a.height - b.width * b.height;
        if (areaDiff != 0) return areaDiff;
        const xDiff = a.x - b.x;
        return xDiff == 0 ? a.y - b.y : xDiff;
    }

    /**
     * Does BoundingBox `a` contain `b`. Is `b` within `a`
     */
    public static contains(a: BoundingBox, b: BoundingBox): boolean {
        return a.x <= b.x && a.x + a.width >= b.x + b.width && a.y <= b.y && a.y + a.height >= b.y + b.height;
    }
}
