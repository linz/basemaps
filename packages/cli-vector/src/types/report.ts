import { z } from 'zod';

/**
 * Interface describing a LayerReport object as created and exported by the vector-cli 'reports' command.
 */
export interface LayerReport {
  /**
   * Name of the Shortbread layer for which the report derives.
   *
   * @example "addresses"
   * @example "boundaries"
   * @example "contours"
   */
  name: string;

  /**
   * FeaturesReport object containing information from all features, regardless of `kind` attribute value.
   */
  all: FeaturesReport;

  /**
   * FeaturesReport objects deriving information from all features with the same `kind` attribute value.
   *
   * @example { "contours": FeaturesReport, "peaks": FeaturesReport }
   */
  kinds?: Record<string, FeaturesReport>;
}

export interface FeaturesReport {
  /**
   * @example { "feature": { "guaranteed": true, "type": "string", "values": ["people", "industrial"] } }
   */
  attributes: Record<string, AttributeReport>;

  /**
   * @example ["LineString"]
   */
  geometries: ('LineString' | 'Point' | 'Polygon' | 'Unknown')[];

  /**
   * @example [12, 13, 14, 15]
   */
  zoom_levels: number[];
}

export interface AttributeReport {
  /**
   * `true`, if all features of the parent `FeaturesReport` define this attribute. Otherwise, `false`.
   */
  guaranteed: boolean;

  /**
   * @example ["boolean", "string"]
   */
  types: string[];

  /**
   * @example ["people", "industrial"]
   */
  values: unknown[];

  /**
   * `true`, if all features of the parent `FeaturesReport` define this attribute with more than `MaxValues` (i.e. 20) unique values. Otherwise, `false`.
   * Capturing all unique values at runtime demands too much memory. Useful for determining if an attribute is likely to describe a limited set of options (i.e an Enum).
   */
  has_more_values: boolean;
}

const zAttributeReport = z.object({
  guaranteed: z.boolean(),
  types: z.array(z.string()),
  values: z.array(z.union([z.boolean(), z.number(), z.string()])),
  has_more_values: z.boolean(),
}) satisfies z.ZodType<AttributeReport>;

const zFeaturesReport = z.object({
  attributes: z.record(z.string(), zAttributeReport),
  geometries: z.array(
    z.union([z.literal('LineString'), z.literal('Point'), z.literal('Polygon'), z.literal('Unknown')]),
  ),
  zoom_levels: z.array(z.number()),
}) satisfies z.ZodType<FeaturesReport>;

export const zLayerReport = z.object({
  name: z.string(),
  all: zFeaturesReport,
  kinds: z.record(z.string(), zFeaturesReport).optional(),
}) satisfies z.ZodType<LayerReport>;
