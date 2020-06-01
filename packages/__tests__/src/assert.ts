import * as o from 'ospec';

// Redefine these interfaces as we do not want a cyclic dependency on @basemaps/geo
interface LatLon {
    lat: number;
    lon: number;
}

interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Assert that number a is within variance of number b
 * @param numA
 * @param numB
 * @param text message to output when testing fails
 * @param variance maximum difference between the numbers
 */
export function approxEqual(numA: number | undefined, numB: number, text: string, variance = 0.001): void {
    if (numA == null) {
        o(numA).notEquals(undefined)(`${text} should be approx equal to ${numB}`);
        return;
    }
    const diff = Math.abs(numA - numB);
    o(diff <= variance).equals(true)(`${text} (${numA} vs ${numB}) should be less than ${variance}`);
}

export function approxBounds(boundsA: Bounds | null | undefined, boundsB: Bounds, name = ''): void {
    approxEqual(boundsA?.width, boundsB.width, `${name}:width`);
    approxEqual(boundsA?.height, boundsB.height, `${name}:height`);
    approxEqual(boundsA?.y, boundsB.y, `${name}:top`);
    approxEqual(boundsA?.x, boundsB.x, `${name}:left`);
}

export function approxLatLon(latLonA: LatLon | null | undefined, latLonB: LatLon, variance = 0.0001): void {
    approxEqual(latLonA?.lat, latLonB.lat, 'lat', variance);
    approxEqual(latLonA?.lon, latLonB.lon, 'lon', variance);
}
