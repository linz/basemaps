import { EPSG, Projection, Bounds } from '@basemaps/geo';
import * as Mercator from 'global-mercator';
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

/**
 * Change the projection of a bounding box
 * @param bbox
 * @param fromProj
 * @param toProj
 */
export function projectBBox(bbox: Mercator.BBox | number[], fromProj = EPSG.Wgs84, toProj = EPSG.Wgs84): Mercator.BBox {
    if (fromProj === toProj) return bbox.slice() as Mercator.BBox;

    const { forward } = proj4(Projection.toEpsgString(fromProj), Projection.toEpsgString(toProj));

    const tl = forward([bbox[0], bbox[3]]);
    const br = forward([bbox[2], bbox[1]]);

    return [tl[0], br[1], br[0], tl[1]];
}

/**
 * Convert a quadKey to its bounding box
 * @param quadKey
 * @param epsg for the bbox
 */
export function quadKeyToBounds(quadKey: string, epsg: EPSG = EPSG.Wgs84): Bounds {
    const bbox = Mercator.googleToBBox(Mercator.quadkeyToGoogle(quadKey));
    return Bounds.fromBbox(epsg === EPSG.Wgs84 ? bbox : projectBBox(bbox, EPSG.Wgs84, epsg));
}
