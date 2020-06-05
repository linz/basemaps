import { Epsg } from '@basemaps/geo';
import * as proj4 from 'proj4';
import { Nztm2000 } from './nztm2000';
import { Citm2000 } from './citm2000';
import { CompositeError } from '@basemaps/shared';

proj4.defs(Epsg.Nztm2000.toEpsgString(), Nztm2000);
proj4.defs(Epsg.Citm2000.toEpsgString(), Citm2000);

export type Converter = proj4.Converter;

export function getProjection(fromProjection: Epsg, toProjection?: Epsg): proj4.Converter {
    try {
        return proj4(fromProjection.toEpsgString(), toProjection?.toEpsgString());
    } catch (err) {
        throw new CompositeError(
            `Failed to create projection: ${fromProjection.toEpsgString()}, ${toProjection?.toEpsgString()}`,
            err,
        );
    }
}

/**
 * Attempt to guess the projection based off the WKT
 *
 * @example
 *
 * "PCS Name = NZGD_2000_New_Zealand_Transverse_Mercator|GCS Name = GCS_NZGD_2000|Ellipsoid = GRS_1980|Primem = Greenwich||"
 * "NZGD2000_New_Zealand_Transverse_Mercator_2000|GCS Name = GCS_NZGD_2000|Primem = Greenwich||"
 *
 * @param wkt
 */
export function guessProjection(wkt: string): Epsg | null {
    if (wkt == null) {
        return null;
    }
    const searchWkt = wkt.replace(/_/g, ' ');
    if (searchWkt.includes('New Zealand Transverse Mercator')) {
        return Epsg.Nztm2000;
    }
    return null;
}
