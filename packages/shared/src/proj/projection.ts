import { Bounds, Epsg, EpsgCode, GeoJson } from '@basemaps/geo';
import { Position } from 'geojson';
import Proj from 'proj4';
import { NamedBounds } from '../aws/tile.metadata.base';
import { CompositeError } from '../composite.error';
import { Citm2000 } from './citm2000';
import { Nztm2000 } from './nztm2000';

Proj.defs(Epsg.Nztm2000.toEpsgString(), Nztm2000);
Proj.defs(Epsg.Citm2000.toEpsgString(), Citm2000);

const CodeMap = new Map<EpsgCode, Projection>();

export class Projection {
    epsg: Epsg;

    /** Transform coordinates to and from Wsg84 */
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

        const { toWsg84 } = this;
        const { fromWsg84 } = targetProjection;

        return multipoly.map((poly) => poly.map((ring) => ring.map((p) => fromWsg84(toWsg84(p)))));
    }

    /**
     * Convert source `[x, y]` coordinates to `[lon, lat]`
     */
    get toWsg84(): (coordinates: Position) => Position {
        return this.projection.forward;
    }

    /**
     * Convert `[lon, lat]` coordinates to source `[x, y]`
     */
    get fromWsg84(): (coordinates: Position) => Position {
        return this.projection.inverse;
    }

    /** Convert a tile covering to a GeoJSON FeatureCollection */
    toGeoJson(files: NamedBounds[]): GeoJSON.FeatureCollection {
        const { toWsg84 } = this;
        const polygons: GeoJSON.Feature[] = [];
        for (const bounds of files) {
            const polygon = GeoJson.toFeaturePolygon(
                [
                    Bounds.fromJson(bounds)
                        .toPolygon()[0]
                        .map((p) => toWsg84(p)),
                ],
                {
                    name: bounds.name,
                },
            );
            polygons.push(polygon);
        }

        return GeoJson.toFeatureCollection(polygons);
    }
}
