import { BBox, MultiPolygon, Ring } from './types';

/**
 * Normalize the value of a longitude to between -180 and 180 degrees.

 * @param lon a longitude value than can be outside the range -180 to 180.
 */
const normLon = (lon: number): number => {
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
};

/**
 * Determine this distance and direction between two longitude values

 * @param a must be between -180 and 180
 * @param b must be between -180 and 180

 * @returns the distance which is negative if `a` is east of `b`
 */
const delta = (a: number, b: number): number => {
    const d = b - a;

    if (d > 180) {
        return d - 360;
    } else if (d < -180) {
        return d + 360;
    }

    return d;
};

const calcMid = (a: number, b: number): number => normLon(a + (b < a ? b + 360 - a : b - a));

export const Wgs84 = {
    /**
     * Find the center longitude of a BBox. This handles a bbox that crosses the anti-meridian.

     * @param a must be between -180 and 180
     */
    boxLonCenter(a: BBox): number {
        return normLon(a[0] + 0.5 * (a[2] < a[0] ? 360 + a[2] - a[0] : a[2] - a[0]));
    },

    delta,

    crossesAM(a: number, b: number): boolean {
        return Math.sign(delta(a, b)) !== Math.sign(b - a);
    },

    normLon,

    /**
     * Normalize an extent's longitude to between -180 and 180 degrees.
     * @param extent must be in WGS84 coordinates
     */
    normExtent(extent: BBox): BBox {
        return [normLon(extent[0]), extent[1], normLon(extent[2]), extent[3]];
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

        if (delta(axCenter, bxCenter) < 0) {
            return this.union(b, a);
        }

        const ans = a.slice() as BBox;

        const mid = calcMid(axCenter, bxCenter);

        if (delta(mid, b[0]) < delta(mid, a[0])) ans[0] = b[0];
        if (delta(mid, b[2]) > delta(mid, a[2])) ans[2] = b[2];

        if (b[1] < a[1]) ans[1] = b[1];
        if (b[3] > a[3]) ans[3] = b[3];

        return ans;
    },

    /**
     * Do two GeoJSON bounding boxes intersect?

     * @param a must be in WGS84 coordinates
     * @param b must be in WGS84 coordinates
     */
    intersects(a: BBox, b: BBox): boolean {
        if (a[1] > b[3] || b[1] > a[3]) return false;

        const a0 = a[0];
        const b0 = b[0];
        const a2 = a0 < a[2] ? a[2] : a[2] + 360;
        const b2 = b0 < b[2] ? b[2] : b[2] + 360;

        return (a0 <= b2 && b0 <= a2) || (a0 + 360 <= b2 && b0 <= a2 + 360) || (a0 <= b2 + 360 && b0 + 360 <= a2);
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
                    if (i === 1) {
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
            if (poly.length === 0) continue;
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

    /**
     * Convert a WGS84 `bbox` to a GeoJSON MultiPolygon. Split at anti-meridian if necessary.

     * @param bbox
     */
    bboxToMultiPolygon(bbox: BBox): MultiPolygon {
        const sw = [bbox[0], bbox[1]];
        const se = [bbox[2], bbox[1]];
        const nw = [bbox[0], bbox[3]];
        const ne = [bbox[2], bbox[3]];

        if (bbox[0] < bbox[2]) {
            return [[[sw, nw, ne, se, sw]]] as MultiPolygon;
        }

        return [
            [[sw, nw, [180, ne[1]], [180, se[1]], sw]],
            [[ne, se, [-180, sw[1]], [-180, nw[1]], ne]],
        ] as MultiPolygon;
    },
};
