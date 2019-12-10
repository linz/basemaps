import * as proj4 from 'proj4';
import { NZGD2000 } from './nzgd2000';

proj4.defs('NZGD2000', NZGD2000);
proj4.defs('EPSG:2193', NZGD2000);

// Assert projections 3857 & 2193 exists
proj4('EPSG:3857');
proj4('EPSG:2193');

export function getProjection(epsg: number): proj4.Converter | null {
    try {
        return proj4(`EPSG:${epsg}`);
    } catch (e) {
        return null;
    }
}
