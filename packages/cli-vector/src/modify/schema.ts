import { VectorGeoFeature } from '../types/VectorGeoFeature.js';

export interface VectorGeoPlaceLabelsFeature extends VectorGeoFeature {
  properties: {
    /** @example "Kaitaia" */
    name: string;

    /** @example "ant" */
    kind: string;

    /** @example "cape" */
    natural?: string;

    /** @example "city" */
    place?: string;

    /** @example "bay" */
    water?: string;
  };
}
