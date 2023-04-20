export { MultiPolygon, Polygon, Ring, Pair } from 'polygon-clipping';

export type BBox = [number, number, number, number];

/**
 * GeoJSON Feature with compulsory `bbox`
 */
export interface BBoxFeature<
  G extends GeoJSON.Geometry = GeoJSON.Polygon | GeoJSON.MultiPolygon,
  P = GeoJSON.GeoJsonProperties,
> extends GeoJSON.Feature<G, P> {
  bbox: BBox;
}

/**
 * GeoJSON FeatureCollection with compulsory `bbox`
 */
export interface BBoxFeatureCollection<
  G extends GeoJSON.Geometry = GeoJSON.Polygon | GeoJSON.MultiPolygon,
  P = GeoJSON.GeoJsonProperties,
> extends GeoJSON.FeatureCollection<G, P> {
  features: Array<BBoxFeature<G, P>>;
}

/**
 * GeoJSON FeatureCollection with coordinate reference
 *
 * Useful for creating non standard GeoJSON files with projection other than WGS84
 */
export interface FeatureCollectionWithCrs extends GeoJSON.FeatureCollection {
  crs: {
    type: string;
    properties: {
      /**
       * CRS definition, a EPSG reference
       * @example "urn:ogc:def:crs:EPSG::2193"
       */
      name: string;
    };
  };
}
