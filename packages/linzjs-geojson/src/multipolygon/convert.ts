import { MultiPolygon, Pair, Ring, BBox } from '../types';
import { clipMultipolygon } from './clipped';
import { Wgs84 } from '../wgs84';

const WorldBounds: BBox = [-180, -90, 180, 90];
const NextWorldBounds: BBox = [180, -90, 360, 90];

export type ConvertCoordinates = (coordinates: number[]) => number[];

/**
 * Find the point which is `frac` along length of a line

 * @param frac a number between 0 and 1
 * @param a line start
 * @param b line end
 */
function pointAtFrac(frac: number, a: Pair, b: Pair): Pair {
    return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
}

/**
 * Split a polygon that goes over 180 degrees and normalize between -180 and 180 degrees.

 * @param multipoly As collection of polygons that have longitude points between -180 and 520 degrees.
 */
export function splitWgs84MultiPolygon(multipoly: MultiPolygon): MultiPolygon {
    const result: MultiPolygon = [];

    // clip to between -180 and 180 degrees
    for (const poly of clipMultipolygon(multipoly, WorldBounds)) {
        result.push(poly);
    }

    // clip to between 180 and 520 degress and transpose to between -180 and 180
    for (const poly of clipMultipolygon(multipoly, NextWorldBounds)) {
        result.push(poly.map((ring) => ring.map((point) => [point[0] - 360, point[1]])));
    }

    return result;
}

/**
 * Converts `multipoly` to WGS84 coordinates spliting any subpolygons that cross the anti-meridian

 * @param multipoly a collection of polygons in source coordinates

 * @param toWgs84 a function to convert an `[x, y]` coordinate to a `[lon, lat]` WGS84 coordinate.
 * Note the result may be mutated by this function. The `proj4js` convert functions are suitable candidates.

 * @param split if false will not split the polygon; instead the lines that cross the antimeridian
 * will be offset by 360 degrees.
 */
export function multiPolygonToWgs84(multipoly: MultiPolygon, toWgs84: ConvertCoordinates, split = true): MultiPolygon {
    let polyCrossesAM = false; // does any line cross antimeridian
    let crossing = false; // are we currently across the antimeridian

    const result = multipoly.map((sPoly) =>
        sPoly.map((sRing) => {
            const wRing: Ring = []; // converted ring in Wgs84
            if (sRing.length === 0) return wRing;

            let sPrev = sRing[0]; // previous source point
            let wPrev: Pair | null = null; // previous wgs84 point
            let pLon = 0; // previous unadjusted wgs84 longitude

            for (const sPoint of sRing) {
                const wPoint = toWgs84(sPoint) as Pair;
                const wLon = wPoint[0]; // current unadjusted wgs84 longitude

                // look for lines crossing antimeridian
                if (wPrev != null) {
                    const lineCrosses = Wgs84.crossesAM(pLon, wLon);
                    if (lineCrosses) {
                        polyCrossesAM = true;
                        crossing = !crossing;
                    }
                    if (crossing) {
                        // adjust lon by 360 degrees
                        if (wLon < 0) {
                            wPoint[0] = wLon + 360;
                        } else {
                            wPrev[0] = pLon + 360;
                        }
                    }
                    if (lineCrosses) {
                        // insert a point on the AM which approximates a straight line in
                        // source coordinates.
                        const frac = (180 - wPoint[0]) / (wPrev[0] - wPoint[0]);
                        const midPoint = toWgs84(pointAtFrac(frac, sPoint, sPrev));
                        // approximation error is: 180 - midPoint[0];
                        wRing.push([180, midPoint[1]]); // this will cause split to happen here
                    }
                }
                wRing.push(wPoint);
                sPrev = sPoint;
                wPrev = wPoint;
                pLon = wLon;
            }

            return wRing;
        }),
    );

    if (polyCrossesAM && split) {
        return splitWgs84MultiPolygon(result);
    }

    return result;
}
