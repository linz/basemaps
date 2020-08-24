import lineclip from 'lineclip';
import pc from 'polygon-clipping';
import { bboxToPolygon } from '../bbox';
import { BBox, MultiPolygon, Polygon } from '../types';

export const { intersection, union } = pc;

function samePoint(a: number[], b: number[]): boolean {
    return a[0] == b[0] && a[1] == b[1];
}

function removeDegenerateEdges(polygons: MultiPolygon, bbox: BBox): MultiPolygon {
    return intersection(polygons, bboxToPolygon(bbox) as Polygon);
}

/**
 * Clip a MultiPolygon to a bounding box.

 * @param polygons a GeoJSON MultiPolygon not necessarily in WGS84 coordinates. Does not handle
 * lines crossing the antimeridian in WGS84.

 * @param bbox bounding box in the same coordinates and the `polygons`.
 */
export function clipMultipolygon(polygons: MultiPolygon, bbox: BBox): MultiPolygon {
    const result: MultiPolygon = [];
    for (const poly of polygons) {
        const clipped = lineclip.polygon(poly[0], bbox);
        if (clipped.length != 0) {
            if (!samePoint(clipped[0], clipped[clipped.length - 1])) clipped.push(clipped[0]);
            result.push([clipped]);
        }
    }
    return removeDegenerateEdges(result, bbox);
}
