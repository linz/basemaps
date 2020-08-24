import { BBox, MultiPolygon, Ring } from './types';

export const Wgs84 = {
    /**
     * Find the center longitude of a BBox. This handles a bbox that crosses the anti-meridian.

     * @param a must be between -180 and 180
     */
    boxLonCenter(a: BBox): number {
        return this.normLon(a[0] + 0.5 * (a[2] < a[0] ? 360 + a[2] - a[0] : a[2] - a[0]));
    },

    /**
     * Determine this distance and direction between two longitude values

     * @param a must be between -180 and 180
     * @param b must be between -180 and 180

     * @returns the distance which is negative if `a` is east of `b`
     */
    delta(a: number, b: number): number {
        const d = b - a;

        if (d > 180) {
            return d - 360;
        } else if (d < -180) {
            return d + 360;
        }

        return d;
    },

    crossesAM(a: number, b: number): boolean {
        return Math.sign(this.delta(a, b)) != Math.sign(b - a);
    },

    /**
     * Normalize the value of a longitude to between -180 and 180 degrees.

     * @param lon a longitude value than can be outside the range -180 to 180.
     */
    normLon(lon: number): number {
        if (lon < -360) {
            lon = -(-lon % 360);
        } else if (lon > 360) {
            lon = lon % 360;
        }

        if (lon < -180) {
            return 360 + lon;
        } else if (lon > 180) {
            return lon - 360;
        }

        return lon;
    },

    /**
     * Union two GeoJSON bounding boxes. This handles bboxes that cross the anti-meridian (ie; east
     * < west). If two boxes are disjoint then the union will span the east-west distance or
     * west-east distance which ever is closer.

     * @param a must be in WGS84 coordinates
     * @param b must be in WGS84 coordinates
     */
    union(a: BBox, b: BBox | null | undefined): BBox {
        if (b == null) {
            return a.slice() as BBox;
        }
        const axCenter = Wgs84.boxLonCenter(a);
        const bxCenter = Wgs84.boxLonCenter(b);

        if (this.delta(axCenter, bxCenter) < 0) {
            return this.union(b, a);
        }

        const ans = a.slice() as BBox;

        const mid = this.normLon(axCenter + (bxCenter < axCenter ? bxCenter + 360 - axCenter : bxCenter - axCenter));

        if (this.delta(mid, b[0]) < this.delta(mid, a[0])) ans[0] = b[0];
        if (this.delta(mid, b[2]) > this.delta(mid, a[2])) ans[2] = b[2];

        if (b[1] < a[1]) ans[1] = b[1];
        if (b[3] > a[3]) ans[3] = b[3];

        return ans;
    },

    /**
     * Find the bounding box of a WGS84 `ring` taking into account the
     * anti-meridian.

     * @param ring and array of points.

     * @return a GeoJSON compliant bounding box
     */
    ringToBbox(ring: Ring): BBox {
        if (ring.length < 3) {
            throw new Error('Invalid ring');
        }

        let crossing = false; // are we currently across the antimeridian
        const prev = ring[0];
        let minX = prev[0];
        let minY = prev[1];
        let maxX = minX;
        let maxY = minY;
        let pLon = minX;
        for (let i = 1; i < ring.length; ++i) {
            const curr = ring[i];
            let lon = curr[0];

            const lineCrosses = Wgs84.crossesAM(pLon, lon);

            if (lineCrosses) {
                crossing = !crossing;
            }
            if (crossing) {
                if (lon < 0) {
                    lon += 360;
                } else {
                    pLon += 360;
                    if (i == 1) {
                        // need to adjust the initial values
                        minX = maxX = pLon;
                    }
                }
            }
            if (lon < minX) minX = lon;
            else if (lon > maxX) maxX = lon;
            const lat = curr[1];
            if (lat < minY) minY = lat;
            else if (lat > maxY) maxY = lat;
            pLon = curr[0];
        }
        return [this.normLon(minX), minY, this.normLon(maxX), maxY];
    },

    /**
     * Find the bounding box of a WGS84 `multipolygon` taking into account the anti-meridian

     * @param multipolygon the coordinates of a compliant GeoJSON MultiPolygon

     * @return a GeoJSON compliant bounding box
     */
    multiPolygonToBbox(multipolygon: MultiPolygon): BBox {
        let ans: BBox | null = null;
        for (const poly of multipolygon) {
            if (poly.length == 0) continue;
            const ring = poly[0];
            if (ring.length < 3) continue;

            const bbox = this.ringToBbox(ring);
            ans = ans == null ? bbox : this.union(ans, bbox);
        }
        if (ans == null) {
            throw new Error('Invalid multipolygon');
        }
        return ans;
    },
};
