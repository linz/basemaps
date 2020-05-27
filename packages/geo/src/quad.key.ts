import { quadkeyToTile, tileToBBOX } from '@mapbox/tilebelt';
import { Bounds } from './bounds';

export const QuadKey = {
    Keys: ['0', '1', '2', '3'],
    /**
     * Intersection of quad keys
     * @param qkA QuadKey A
     * @param qkB QuadKey B
     * @returns whether qkA intersects qkB
     */
    intersects(qkA: string, qkB: string): boolean {
        const shortestLength = Math.min(qkA.length, qkB.length);
        return qkA.substr(0, shortestLength) == qkB.substr(0, shortestLength);
    },

    /**
     * Return the prefix that is common to two intersecting quad keys
     * @param qkA QuadKey A
     * @param qkB QuadKey B
     */
    commonPrefix(qkA: string, qkB: string): string {
        const len = Math.min(qkA.length, qkB.length);
        let i = 0;
        for (; i < len; ++i) if (qkA[i] !== qkB[i]) break;
        return qkA.slice(0, i);
    },

    /**
     * Get the quadkey's children
     * @example
     * '3' -> ['30', '31', '32', '33']
     *
     * @param qk
     */
    children(qk: string): string[] {
        return QuadKey.Keys.map((c) => qk + c);
    },

    /**
     * Get the parent quadkey for the quadkey
     *
     * @example
     * `31` -> `3`
     * @param qk
     */
    parent(qk: string): string {
        return qk.substr(0, qk.length - 1);
    },

    toXYZ(quadKey: string): [number, number, number] {
        return quadkeyToTile(quadKey);
    },

    toBbox(quadKey: string): [number, number, number, number] {
        return tileToBBOX(quadkeyToTile(quadKey));
    },

    /**
     * Convert a quadKey to its bounding box
     * @param quadKey
     * @return The bounds in `Epsg.Wgs84`
     */
    toBounds(quadKey: string): Bounds {
        return Bounds.fromBbox(this.toBbox(quadKey));
    },

    /**
     * Compare quadkeys such that using with sort will result in a list from Biggest coverage to smallest.
     * @param a
     * @param b
     * @retun < 0, = 0 or > 0
     */
    compareKeys(a: string, b: string): number {
        return a == b ? 0 : a.length == b.length ? (a < b ? -1 : 1) : a.length - b.length;
    },
};
