import { Epsg, EpsgCode } from './epsg.js';

/**
 * Order of X & Y coordinates when defined as a array
 *
 * `[x,y]` vs `[y,x]`
 */
export type XyOrder = 'xy' | 'yx';

/**
 * Get the X & Y coordinate order for a given EPSG
 * @param epsg EPSG to lookup
 */
export function getXyOrder(epsg: Epsg | EpsgCode): XyOrder {
  const code = typeof epsg === 'number' ? epsg : epsg.code;
  /**
   * - [EPSG:2193](https://www.opengis.net/def/crs/EPSG/0/2193) (NZTM) is defined in [y, x]
   * - [EPSG:3793](https://www.opengis.net/def/crs/EPSG/0/3793) (CITM) is defined in [y, x]
   * specified by the coordinate system [cs:4500](https://www.opengis.net/def/cs/EPSG/0/4500)
   */
  if (code === EpsgCode.Nztm2000 || code === EpsgCode.Citm2000) return 'yx';

  // TODO there are other projections that are YX,
  // TileMatrixSet v2 specification includes Xy ordering, https://docs.ogc.org/is/17-083r4/21-066r1.html#_adding_optional_orderedaxes_to_highlight_crs_axis_ordering
  return 'xy';
}
