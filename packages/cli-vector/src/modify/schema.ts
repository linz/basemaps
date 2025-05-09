import { VectorGeoFeature } from '../types/VectorGeoFeature.js';

export interface VectorGeoPlaceLabelsFeature extends VectorGeoFeature {
  properties: {
    /** @example "Kaitaia" */
    name: string;

    /** @example "TWN1" */
    kind: string;

    /** @example "city" */
    place: string;

    /** @example 7 */
    adminlevel: number;

    /** @example "0" */
    natural: string;

    /** @example "0" */
    water: string;
  };
}
