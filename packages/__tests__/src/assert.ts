import o from 'ospec';

// Redefine these interfaces as we do not want a cyclic dependency on @basemaps/geo
interface LatLon {
    lat: number;
    lon: number;
}

interface Point {
    x: number;
    y: number;
}

interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Prefix a message if the prefix exists */
function prefix(base: string, prefixText?: string): string {
    if (prefixText) return `${prefixText}:${base}`;
    return base;
}

/**
 * Assert that number a is within variance of number b
 * @param numA
 * @param numB
 * @param text message to output when testing fails
 * @param variance maximum difference between the numbers
 */
function approxEqual(numA: number | undefined, numB: number, text: string, variance = 0.001): void {
    if (numA == null) {
        o(numA).notEquals(undefined)(`${text} should be approx equal to ${numB}`);
        return;
    }
    const diff = Math.abs(numA - numB);
    o(diff <= variance).equals(true)(`${text} (${numA} vs ${numB}) should be less than ${variance}`);
}

function approxBounds(boundsA: Bounds | null | undefined, boundsB: Bounds, message?: string, variance?: number): void {
    approxEqual(boundsA?.width, boundsB.width, prefix('width', message), variance);
    approxEqual(boundsA?.height, boundsB.height, prefix('height', message), variance);
    approxEqual(boundsA?.y, boundsB.y, prefix('top', message), variance);
    approxEqual(boundsA?.x, boundsB.x, prefix('left', message), variance);
}

function approxLatLon(latLonA: LatLon | null | undefined, latLonB: LatLon, message?: string, variance = 0.0001): void {
    approxEqual(latLonA?.lat, latLonB.lat, prefix('lat', message), variance);
    approxEqual(latLonA?.lon, latLonB.lon, prefix('lon', message), variance);
}

function approxPoint(pA: Point | null | undefined, pB: Point, message?: string, variance?: number): void {
    approxEqual(pA?.x, pB.x, prefix('x', message), variance);
    approxEqual(pA?.y, pB.y, prefix('y', message), variance);
}

export const Approx = { point: approxPoint, latLon: approxLatLon, equal: approxEqual, bounds: approxBounds };
