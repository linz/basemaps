import { MultiPolygon, Polygon, Ring } from '../types.js';

export const Area = {
  /**
   * Calculate the cartesian area of a ring using the shoelace formula.
   * Assumes the ring is well-formed and simple (i.e. not self-intersecting).
   * @param ring The ring to calculate the area of.
   * @returns The area of the ring.
   */
  ring(ring: Ring): number {
    let total = 0;
    // if (clockwise) ring.reverse();
    for (let i = 0; i < ring.length - 1; i++) total += ring[i][0] * ring[i + 1][1] - ring[i][1] * ring[i + 1][0];
    return total / 2;
  },
  /**
   * Calculate the cartesian area of a polygon using the shoelace formula.
   * Assumes the polygon is well-formed and simple (i.e. not self-intersecting).
   *
   * [GeoJSON Polygons][1] are an array of rings, where the first ring is the
   * exterior, and any subsequent rings are interior rings (holes).
   * The coordinates of the exterior ring are ordered counterclockwise,
   * while the coordinates of interior rings are ordered clockwise.
   * Area.ring() gives a negative area value for these clockwise interior rings,
   * hence adding the area of all rings together gives the valid area of the
   * polygon, as adding the negative area of the interior rings subtracts it
   * from the positive area of the exterior ring.
   *
   * [1]: https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.6
   * @param poly The polygon to calculate the area of.
   * @returns The area of the polygon.
   */
  polygon(poly: Polygon): number {
    let total = 0;
    for (const ring of poly) total += Area.ring(ring);
    return total;
  },
  /**
   * Calculate the cartesian area of a multipolygon using the shoelace formula.
   * Assumes the multipolygon is well-formed and simple (i.e. not self-intersecting).
   * @param multipoly The polygon to calculate the area of.
   * @returns The area of the polygon.
   */
  multiPolygon(multipoly: MultiPolygon): number {
    let total = 0;
    for (const poly of multipoly) total += Area.polygon(poly);
    return total;
  },
};
