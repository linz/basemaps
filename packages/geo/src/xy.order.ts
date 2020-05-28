import { Epsg } from './epsg';

/**
 * Order of X & Y coordinates when defined as a array
 *
 * `[x,y]` vs `[y,x]`
 */
export enum XyOrder {
    /** [x, y] */
    Xy,
    /** [y, x] */
    Yx,
}

/**
 * Get the X & Y coordinate order for a given EPSG
 * @param epsg EPSG to lookup
 */
export function getXyOrder(epsg: Epsg): XyOrder {
    /**
     * [EPSG:2193](https://www.opengis.net/def/crs/EPSG/0/2193) (NZTM) is defined in [y, x]
     * specified by the coordinate system [cs:4500](https://www.opengis.net/def/cs/EPSG/0/4500)
     */
    if (epsg == Epsg.Nztm2000) {
        return XyOrder.Yx;
    }

    // TODO there are other projections that are YX
    return XyOrder.Xy;
}
