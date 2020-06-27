import { Bounds } from '@basemaps/geo';
import lineclip from 'lineclip';
import pc, { MultiPolygon } from 'polygon-clipping';

function samePoint(a: number[], b: number[]): boolean {
    return a[0] == b[0] && a[1] == b[1];
}

export function clipMultipolygon(polygons: MultiPolygon, bounds: Bounds): MultiPolygon {
    const result: MultiPolygon = [];
    const bbox = bounds.toBbox();
    for (const poly of polygons) {
        const clipped = lineclip.polygon(poly[0], bbox);
        if (clipped.length != 0) {
            if (!samePoint(clipped[0], clipped[clipped.length - 1])) clipped.push(clipped[0]);
            result.push([clipped]);
        }
    }
    return result;
}

export function removeDegenerateEdges(polygons: MultiPolygon, bounds: Bounds): MultiPolygon {
    return pc.intersection(polygons, bounds.toPolygon());
}

export function polyContainsBounds(poly: MultiPolygon, bounds: Bounds): boolean {
    const clipped = clipMultipolygon(poly, bounds);
    if (clipped.length != 1 || clipped[0].length != 1 || clipped[0][0].length != 5) return false;

    return Bounds.fromMultiPolygon(clipped).containsBounds(bounds);
}
