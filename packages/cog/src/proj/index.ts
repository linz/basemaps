import { EPSG, Projection } from '@basemaps/geo';
import * as proj4 from 'proj4';
import { NZGD2000 } from './nzgd2000';

proj4.defs(Projection.toEpsgString(EPSG.Nztm), NZGD2000);

export function getProjection(fromProjection: EPSG, toProjection?: EPSG): proj4.Converter | null {
    try {
        return proj4(Projection.toEpsgString(fromProjection), toProjection && Projection.toEpsgString(toProjection));
    } catch (e) {
        return null;
    }
}

export const Wgs84ToGoogle = getProjection(EPSG.Wgs84, EPSG.Google)!;

/**
 * Attempt to guess the projection based off the WKT
 * @param wkt
 */
export function guessProjection(wkt: string): EPSG | null {
    if (wkt == null) {
        return null;
    }
    if (wkt.includes('NZGD2000') || wkt.includes('NZGD_2000')) {
        return EPSG.Nztm;
    }
    return null;
}
