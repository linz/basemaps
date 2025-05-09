import { Feature } from 'geojson';
import { z } from 'zod';
import { GeoJSONFeatureSchema, GeoJSONGeometrySchema } from 'zod-geojson';

export interface VectorGeoFeature extends Feature {
  properties: Record<string, boolean | null | number | string | undefined>;
  tippecanoe: {
    layer: string;
    minzoom: number;
    maxzoom: number;
  };
}

export const zVectorGeoFeature = z.object({
  geometry: GeoJSONGeometrySchema,
  properties: z.record(z.string(), z.union([z.boolean(), z.null(), z.number(), z.string(), z.undefined()])),
  tippecanoe: z.object({
    layer: z.string(),
    minzoom: z.number(),
    maxzoom: z.number(),
  }),
});

export const VectorGeoFeatureSchema = GeoJSONFeatureSchema.sourceType().merge(
  zVectorGeoFeature,
) satisfies z.ZodType<VectorGeoFeature>;
