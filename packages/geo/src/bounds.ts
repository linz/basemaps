export interface Point {
    x: number;
    y: number;
}
export interface Size {
    width: number;
    height: number;
}

export interface BoundingBox extends Point, Size {}

export class Bounds {
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
     * Create a new bounds that is the intersection of the two bounds
     *
     * @param other Bounds to calculate intersection with
     * @returns new Bounds that is the intersection of the two bounds
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
     * Convert to JSON
     */
    public toJson(): BoundingBox {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    /**
     * Scale the bounding box adjusting top, left, width & height
     *
     * @param scaleX scale x parameters (left, width)
     * @param scaleY scale of y parameters (top, height)
     * @returns new bounds that has been scaled
     */
    public scale(scaleX: number, scaleY: number): Bounds {
        return new Bounds(this.x * scaleX, this.y * scaleY, this.width * scaleX, this.height * scaleY);
    }

    public round(): Bounds {
        return new Bounds(Math.round(this.x), Math.round(this.y), Math.round(this.width), Math.round(this.height));
    }

    public add(bounds: Point): Bounds {
        return new Bounds(this.x + bounds.x, this.y + bounds.y, this.width, this.height);
    }

    public subtract(bounds: Point): Bounds {
        return new Bounds(this.x - bounds.x, this.y - bounds.y, this.width, this.height);
    }

    /** */
    public static fromUpperLeftLowerRight(ul: Point, lr: Point): Bounds {
        return new Bounds(ul.x, ul.y, lr.x - ul.x, lr.y - ul.y);
    }

    public static fromJson(bounds: BoundingBox): Bounds {
        return new Bounds(bounds.x, bounds.y, bounds.width, bounds.height);
    }
}
