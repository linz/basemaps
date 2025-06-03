export interface VectorGeoFeature extends GeoJSON.Feature {
  properties: Record<string, boolean | null | number | string | undefined>;
  tippecanoe: {
    layer: string;
    minzoom: number;
    maxzoom: number;
  };
}
