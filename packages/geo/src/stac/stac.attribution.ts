import { StacCatalog, StacCollection, StacItem } from './index.js';

/**
 * A Single File STAC compliant collection with zoom and priority for calculating attribution of an extent
 */
export type AttributionCollection = StacCollection<{
  'linz:category'?: string;
  'linz:zoom': { min: number; max: number };
  'linz:priority': [number];
  'linz:disabled': boolean;
}>;

/**
 * A Single File STAC compliant feature for calculating attribution of an extent
 */
export type AttributionItem = StacItem<{
  title: string;
  category?: string;
  datetime?: null;
  start_datetime?: string;
  end_datetime?: string;
}>;

/**
 * A Single File STAC compliant attribution json structure.
 */
export interface AttributionStac extends StacCatalog, GeoJSON.GeoJsonObject, Record<string, unknown> {
  type: 'FeatureCollection';
  features: AttributionItem[];
  collections: AttributionCollection[];
}
