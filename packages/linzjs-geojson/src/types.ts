export { MultiPolygon, Polygon, Ring, Pair } from 'polygon-clipping';

export type BBox = [number, number, number, number];

/**
 * GeoJSON Feature with compulsory `bbox`
 */
export interface BBoxFeature<
    G extends GeoJSON.Geometry = GeoJSON.Polygon | GeoJSON.MultiPolygon,
    P = GeoJSON.GeoJsonProperties
> extends GeoJSON.Feature<G, P> {
    bbox: BBox;
}

/**
 * GeoJSON FeatureCollection with compulsory `bbox`
 */
export interface BBoxFeatureCollection<
    G extends GeoJSON.Geometry = GeoJSON.Polygon | GeoJSON.MultiPolygon,
    P = GeoJSON.GeoJsonProperties
> extends GeoJSON.FeatureCollection<G, P> {
    features: Array<BBoxFeature<G, P>>;
}
