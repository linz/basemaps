import { z } from 'zod';

export const zPlaceLabelsProperties = z.object({
  /** @example "Kaitaia" */
  label: z.string(),

  /** @example "TWN1" */
  style: z.string(),

  /** @example "city" */
  place: z.string(),

  /** @example 7 */
  adminlevel: z.number(),

  /** @example "0" */
  natural: z.string(),

  /** @example "0" */
  water: z.string(),
});

export const zPlaceLabelsTippecanoe = z.object({
  /** @example "place_labels" */
  layer: z.string(),

  /** @example 8 */
  minzoom: z.number(),

  /** @example 8 */
  maxzoom: z.number(),
});

export type zTypePlaceLabelsProperties = z.infer<typeof zPlaceLabelsProperties>;
export type zTypePlaceLabelsTippecanoe = z.infer<typeof zPlaceLabelsTippecanoe>;
