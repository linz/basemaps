import * as proj4 from 'proj4';
import { EPSG, Projection } from '@basemaps/shared';
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
