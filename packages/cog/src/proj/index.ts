import { EPSG, Projection } from '@basemaps/geo';
import * as proj4 from 'proj4';
import { NZGD2000 } from './nzgd2000';

proj4.defs(Projection.toEpsgString(EPSG.Nztm), NZGD2000);

/**
 * We need both NZTM and Google to work so assert they exist
 */
proj4(Projection.toEpsgString(EPSG.Google));
proj4(Projection.toEpsgString(EPSG.Nztm));

export function getProjection(epsg: EPSG): proj4.Converter | null {
    try {
        return proj4(Projection.toEpsgString(epsg));
    } catch (e) {
        return null;
    }
}

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
