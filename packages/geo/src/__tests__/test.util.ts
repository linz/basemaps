import * as o from 'ospec';
import { Bounds, BoundingBox } from '../bounds';
import { LatLon } from '../projection';

export function approxEqual(numA: number | undefined, numB: number, text: string, variance = 0.001): void {
    if (numA == null) {
        o(numA).notEquals(undefined)(`${text} should be approx equal to ${numB}`);
        return;
    }
    const diff = Math.abs(numA - numB);
    o(diff <= variance).equals(true)(`${text} (${numA} vs ${numB}) should be less than ${variance}`);
}
export function approxBounds(boundsA: Bounds | null | undefined, boundsB: BoundingBox, name = ''): void {
    approxEqual(boundsA?.width, boundsB.width, `${name}:width`);
    approxEqual(boundsA?.height, boundsB.height, `${name}:height`);
    approxEqual(boundsA?.y, boundsB.y, `${name}:top`);
    approxEqual(boundsA?.x, boundsB.x, `${name}:left`);
}

export function approxLatLon(latLonA: LatLon | null | undefined, latLonB: LatLon): void {
    approxEqual(latLonA?.lat, latLonB.lat, 'lat', 0.0001);
    approxEqual(latLonA?.lon, latLonB.lon, 'lon', 0.0001);
}
