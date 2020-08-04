import { Position } from 'geojson';
import { BBox } from './types';

/**
 * Build a polygon from a bounding box.

 * @param bbox not necessarily in WGS84 coordinates. Does not handle lines crossing the antimeridian
 * in WGS84.

 * @returns a GeoJSON Polygon in the coordinates of `bbox`
 */
export function bboxToPolygon(bbox: BBox): Position[][] {
    return [
        [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[1]],
            [bbox[2], bbox[3]],
            [bbox[0], bbox[3]],
            [bbox[0], bbox[1]],
        ],
    ];
}

/**
 * Does bounding box `a` contain `b`. Is `b` within `a`

 * @param a not necessarily in WGS84 coordinates. Does not handle lines crossing the antimeridian
 * in WGS84.
 * @param b not necessarily in WGS84 coordinates. Does not handle lines crossing the antimeridian
 * in WGS84.
 */
export function bboxContains(a: BBox, b: BBox): boolean {
    return a[0] <= b[0] && a[2] >= b[2] && a[1] <= b[1] && a[3] >= b[3];
}
