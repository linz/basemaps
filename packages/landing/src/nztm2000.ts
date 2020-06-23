import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { register } from 'ol/proj/proj4';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import { Proj } from './proj';

Proj.defs(
    'EPSG:2193',
    '+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);
register(Proj);

const topLeft = Nztm2000Tms.zooms[0].topLeftCorner;
const origin = [topLeft[1], topLeft[0]]; // NZTM is defined as y,x not x,y
const resolutions = Nztm2000Tms.zooms.map((c, i) => Nztm2000Tms.pixelScale(i));
const matrixIds = Nztm2000Tms.zooms.map((c) => c.identifier);

export const NztmOl = {
    resolutions,
    origin,
    matrixIds,
    TileGrid: new WMTSTileGrid({ origin, resolutions, matrixIds }),
};
