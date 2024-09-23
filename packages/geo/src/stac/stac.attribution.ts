import { StacCatalog, StacCollection, StacItem } from './index.js';

/**
 * A Single File STAC compliant collection with zoom and priority for calculating attribution of an extent
 */
export type AttributionCollection = StacCollection<{
  /**
   * Category of the layer
   *
   * @example "Urban Aerial Photos"
   */
  'linz:category'?: string;

  /**
   * Zoom levels that the layer is visit
   */
  'linz:zoom': { min: number; max: number };

  /**
   * Priority order for the layer
   *
   * The higher the number the higher the priority
   *
   * @example [1077]
   */
  'linz:priority': [number];
}>;

/**
 * A Single File STAC compliant feature for calculating attribution of an extent
 */
export type AttributionItem = StacItem<{
  /**
   * Human friendly title of the layer
   *
   * @example "Whanganui 0.075m Urban Aerial Photos (2017)"
   */
  title: string;

  /**
   * Category of the layer
   *
   * @example "Urban Aerial Photos"
   */
  category?: string;

  /**
   * datetime is null as per STAC requirement when {@link start_datetime} and {@link end_datetime} are set
   */
  datetime?: null;

  /**
   * datetime of when the layer started being captured
   */
  start_datetime?: string;

  /**
   * datetime of when the layer stopped being captured
   */
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
