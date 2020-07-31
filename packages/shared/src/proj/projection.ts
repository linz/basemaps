import { BBox, BoundingBox, Bounds, Epsg, EpsgCode, GeoJson } from '@basemaps/geo';
import { Position } from 'geojson';
import Proj from 'proj4';
import { NamedBounds } from '../aws/tile.metadata.base';
import { clipMultipolygon, MultiPolygon, Pair, Ring } from '../clipped.multipolygon';
import { CompositeError } from '../composite.error';
import { Citm2000 } from './citm2000';
import { Nztm2000 } from './nztm2000';
import { Wgs84 } from './wgs84';

Proj.defs(Epsg.Nztm2000.toEpsgString(), Nztm2000);
Proj.defs(Epsg.Citm2000.toEpsgString(), Citm2000);

const CodeMap = new Map<EpsgCode, Projection>();

const WorldBounds = new Bounds(-180, -90, 360, 180);
const NextWorldBounds = new Bounds(180, -90, 360, 180);

/**
 * Find the point which is `frac` along length of a line

 * @param frac a number between 0 and 1
 * @param a line start
 * @param b line end
 */
function pointAtFrac(frac: number, a: Pair, b: Pair): Pair {
    return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
}

export class Projection {
    epsg: Epsg;

    /** Transform coordinates to and from Wgs84 */
    private projection: proj4.Converter;

    /**
     * Wrapper around TileMatrixSet with utilities for converting Points and Polygons
     */
    private constructor(epsg: Epsg) {
        this.epsg = epsg;
        try {
            this.projection = Proj(epsg.toEpsgString(), Epsg.Wgs84.toEpsgString());
        } catch (err) {
            throw new CompositeError(
                `Failed to create projection: ${epsg.toEpsgString()}, ${Epsg.Wgs84.toEpsgString()}`,
                err,
            );
        }
    }

    /**
     * Get the Projection instance for a specified code,
     *
     * throws a exception if the code is not recognized
     *
     * @param epsgCode
     */
    static get(epsgCode: EpsgCode): Projection {
        let proj = CodeMap.get(epsgCode);
        if (proj != null) return proj;
        const epsg = Epsg.tryGet(epsgCode);
        if (epsg == null) {
            throw new Error(`Invalid projection: ${epsgCode}`);
        }
        proj = new Projection(epsg);
        CodeMap.set(epsgCode, proj);
        return proj;
    }

    /**
     * Try to find a corresponding Projection for a number
     * @param epsgCode
     */
    static tryGet(epsgCode?: EpsgCode): Projection | null {
        if (epsgCode == null) return null;
        try {
            return this.get(epsgCode);
        } catch (err) {
            return null;
        }
    }

    /**
     * Project the points in a MultiPolygon array to the `targetProjection`.

     * @return if multipoly is not projected return it verbatim otherwise creates a new multi
     * polygon
     */
    projectMultipolygon(multipoly: Position[][][], targetProjection: Projection): Position[][][] {
        if (targetProjection.epsg.code === this.epsg.code) return multipoly;

        const { toWgs84 } = this;
        const { fromWgs84 } = targetProjection;

        return multipoly.map((poly) => poly.map((ring) => ring.map((p) => fromWgs84(toWgs84(p)))));
    }

    /**
     * Convert source `[x, y]` coordinates to `[lon, lat]`
     */
    get toWgs84(): (coordinates: Position) => Position {
        return this.projection.forward;
    }

    /**
     * Convert `[lon, lat]` coordinates to source `[x, y]`
     */
    get fromWgs84(): (coordinates: Position) => Position {
        return this.projection.inverse;
    }

    /**
     * Convert a source Bounds to GeoJSON WGS84 BoundingBox. In particular if the bounds crosses the
     * anti-meridian then the east component will be less than the west component.

     * @param source
     * @returns [west, south, east, north]
     */
    boundsToWgs84BoundingBox(source: Bounds): BBox {
        const sw = this.toWgs84([source.x, source.y]);
        const ne = this.toWgs84([source.right, source.bottom]);

        return [sw[0], sw[1], ne[0], ne[1]];
    }

    /**
     * Convert a source bounds to a WSG84 GeoJSON Feature

     * @param bounds in source epsg
     * @param properties any properties to include in the feature such as name
     */
    boundsToGeoJsonFeature(bounds: BoundingBox, properties = {}): GeoJSON.Feature {
        const sw = [bounds.x, bounds.y];
        const se = [bounds.x + bounds.width, bounds.y];
        const nw = [bounds.x, bounds.y + bounds.height];
        const ne = [bounds.x + bounds.width, bounds.y + bounds.height];

        const coords = this.multiPolygonToWgs84([[[sw, nw, ne, se, sw] as Ring]]);

        if (coords.length == 1) {
            return GeoJson.toFeaturePolygon(coords[0], properties);
        }

        return GeoJson.toFeatureMultiPolygon(coords, properties);
    }

    /**
     * Split a polygon that goes over 180 degrees and normalize between -180 and 180 degrees.

     * @param multipoly As collection of polygons that have longitude points between -180 and 520 degrees.
     */
    splitWgs84MultiPolygon(multipoly: MultiPolygon): MultiPolygon {
        const result: MultiPolygon = [];

        // clip to between -180 and 180 degrees
        for (const poly of clipMultipolygon(multipoly, WorldBounds)) {
            result.push(poly);
        }

        // clip to between 180 and 520 degress and transpose to between -180 and 180
        for (const poly of clipMultipolygon(multipoly, NextWorldBounds)) {
            result.push(poly.map((ring) => ring.map((point) => [point[0] - 360, point[1]])));
        }

        return result;
    }

    /**
     * Converts `multipoly` to WGS84 coordinates spliting any subpolygons that cross the anti-meridian

     * @param multipoly a collection of polygons in source coordinates

     * @param split if false will not split the polygon; instead the lines that cross the antimeridian will be
     * offset by 360 degrees.
     */
    multiPolygonToWgs84(multipoly: MultiPolygon, split = true): MultiPolygon {
        const { toWgs84 } = this;

        let polyCrossesAM = false; // does any line cross antimeridian
        let crossing = false; // are we currently across the antimeridian

        const result = multipoly.map((sPoly) =>
            sPoly.map((sRing) => {
                const wRing: Ring = []; // converted ring in Wgs84
                if (sRing.length == 0) return wRing;

                let sPrev = sRing[0]; // previous source point
                let wPrev: Pair | null = null; // previous wgs84 point
                let pLon = 0; // previous unadjusted wgs84 longitude

                for (const sPoint of sRing) {
                    const wPoint = toWgs84(sPoint) as Pair;
                    const wLon = wPoint[0]; // current unadjusted wgs84 longitude

                    // look for lines crossing antimeridian
                    if (wPrev != null) {
                        const lineCrosses = Wgs84.crossesAM(pLon, wLon);
                        if (lineCrosses) {
                            polyCrossesAM = true;
                            crossing = !crossing;
                        }
                        if (crossing) {
                            // adjust lon by 360 degrees
                            if (wLon < 0) {
                                wPoint[0] = wLon + 360;
                            } else {
                                wPrev[0] = pLon + 360;
                            }
                        }
                        if (lineCrosses) {
                            // insert an point on the AM which approximates a straight line in
                            // source coordinates.
                            const frac = (180 - wPoint[0]) / (wPrev[0] - wPoint[0]);
                            const midPoint = toWgs84(pointAtFrac(frac, sPoint, sPrev));
                            // approximation error is: 180 - midPoint[0];
                            wRing.push([180, midPoint[1]]); // this will cause split to happen here
                        }
                    }
                    wRing.push(wPoint);
                    sPrev = sPoint;
                    wPrev = wPoint;
                    pLon = wLon;
                }

                return wRing;
            }),
        );

        if (polyCrossesAM && split) {
            return this.splitWgs84MultiPolygon(result);
        }

        return result;
    }

    /** Convert a tile covering to a GeoJSON FeatureCollection */
    toGeoJson(files: NamedBounds[]): GeoJSON.FeatureCollection {
        return GeoJson.toFeatureCollection(files.map((f) => this.boundsToGeoJsonFeature(f, { name: f.name })));
    }
}
