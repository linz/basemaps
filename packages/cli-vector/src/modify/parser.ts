import { z } from 'zod';

export const zPlaceLabelsProperties = z.object({
  /** @example "Kaitaia" */
  label: z.string(),

  /** @example 8 */
  zoom_level: z.number(),

  /** @example "TWN1" */
  style: z.string(),

  /** @example "cape" */
  natural: z
    .string()
    .transform((value) => (value === '0' ? undefined : value))
    .optional(),

  /** @example "city" */
  place: z
    .string()
    .transform((value) => (value === '0' ? undefined : value))
    .optional(),

  /** @example "bay" */
  water: z
    .string()
    .transform((value) => (value === '0' ? undefined : value))
    .optional(),
});

export type zTypePlaceLabelsProperties = z.infer<typeof zPlaceLabelsProperties>;
