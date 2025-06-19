import { z } from 'zod';

const optionalString = z.preprocess((value) => {
  if (value === '0' || value === null) {
    return undefined;
  } else {
    return value;
  }
}, z.string().optional());

export const zPlaceLabelsProperties = z.object({
  /** @example "Kaitaia" */
  label: z.string(),

  /** @example 8 */
  zoom_level: z.number(),

  /** @example "TWN1" */
  style: z.string(),

  /** @example "cape" */
  natural: optionalString,

  /** @example "city" */
  place: optionalString,

  /** @example "bay" */
  water: optionalString,
});

export type zTypePlaceLabelsProperties = z.infer<typeof zPlaceLabelsProperties>;
