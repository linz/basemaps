import { Feature } from 'geojson';

export interface VectorGeoFeature extends Feature {
  properties: Record<string, boolean | null | number | string | undefined>;
  tippecanoe: {
    layer: string;
    minzoom: number;
    maxzoom: number;
  };
}
