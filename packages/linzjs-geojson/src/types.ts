import { Feature, FeatureCollection, GeoJsonProperties, Geometry, MultiPolygon, Polygon } from 'geojson';

export { MultiPolygon, Polygon, Ring, Pair } from 'polygon-clipping';

export type BBox = [number, number, number, number];

/**
 * GeoJSON Feature with compulsory `bbox`
 */
export interface BBoxFeature<G extends Geometry = Polygon | MultiPolygon, P = GeoJsonProperties> extends Feature<G, P> {
    bbox: BBox;
}

/**
 * GeoJSON FeatureCollection with compulsory `bbox`
 */
export interface BBoxFeatureCollection<G extends Geometry = Polygon | MultiPolygon, P = GeoJsonProperties>
    extends FeatureCollection<G, P> {
    features: Array<BBoxFeature<G, P>>;
}
