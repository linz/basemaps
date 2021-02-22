import { BoundingBox, Epsg, EpsgCode } from '@basemaps/geo';
import {
    BBox,
    BBoxFeature,
    BBoxFeatureCollection,
    MultiPolygon,
    multiPolygonToWgs84,
    toFeatureMultiPolygon,
    toFeaturePolygon,
} from '@linzjs/geojson';
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
    boundsToWgs84BoundingBox(source: BoundingBox): BBox {
        const sw = this.toWgs84([source.x, source.y]);
        const ne = this.toWgs84([source.x + source.width, source.y + source.height]);

        return [sw[0], sw[1], ne[0], ne[1]];
    }

    /**
     * Convert a source bounds to a WSG84 GeoJSON Feature

     * @param bounds in source epsg
     * @param properties any properties to include in the feature such as name

     * @returns If `bounds` crosses the antimeridian then and east and west pair of non crossing
     * polygons will be returned; otherwise a single Polygon will be returned.
     */
    boundsToGeoJsonFeature(bounds: BoundingBox, properties = {}): BBoxFeature {
        const sw = [bounds.x, bounds.y];
        const se = [bounds.x + bounds.width, bounds.y];
        const nw = [bounds.x, bounds.y + bounds.height];
        const ne = [bounds.x + bounds.width, bounds.y + bounds.height];

        const coords = multiPolygonToWgs84([[[sw, nw, ne, se, sw]]] as MultiPolygon, this.toWgs84);

        const feature =
            coords.length === 1 ? toFeaturePolygon(coords[0], properties) : toFeatureMultiPolygon(coords, properties);
        feature.bbox = this.boundsToWgs84BoundingBox(bounds);

        return feature as BBoxFeature;
    }

    /** Convert a tile covering to a GeoJSON FeatureCollection */
    toGeoJson(files: NamedBounds[]): BBoxFeatureCollection {
        return {
            type: 'FeatureCollection',
            features: files.map((f) => this.boundsToGeoJsonFeature(f, { name: f.name })),
        };
    }
}
