import { StacCatalog, StacCollection, StacItem } from './index';

/**
 * A Single File STAC compliant collection with zoom and priority for calculating attribution of an extent
 */
export type AttributionCollection = StacCollection<{
    gsd: [number];
    'linz:zoom': { min: number; max: number };
    'linz:priority': [number];
}>;

/**
 * A Single File STAC compliant feature for calculating attribution of an extent
 */
export type AttributionItem = StacItem<{
    datetime: null;
    start_datetime: string;
    end_datetime: string;
}>;

/**
 * A Single File STAC compliant attribution json structure.
 */
export interface AttributionStac extends StacCatalog, GeoJSON.GeoJsonObject {
    type: 'FeatureCollection';
    features: AttributionItem[];
    collections: AttributionCollection[];
}
