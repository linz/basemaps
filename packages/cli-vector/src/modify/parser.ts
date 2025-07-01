import { z } from 'zod';

const optionalString = z.preprocess((value) => (value == null ? undefined : value), z.string().optional());

export const zPlaceLabelsProperties = z.object({
  /** @example "Kaitaia" */
  label: z.string(),

  /** @example 7 */
  admin_level: z.number(),

  /** @example "peak" */
  natural: optionalString,

  /** @example "city" */
  place: optionalString,

  /** @example "sea" */
  water: optionalString,
});

export type zTypePlaceLabelsProperties = z.infer<typeof zPlaceLabelsProperties>;
