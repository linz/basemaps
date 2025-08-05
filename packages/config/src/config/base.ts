import { z } from 'zod';

import { ConfigId } from '../index.js';

/**
 * Ensure a ID is prefixed with one of the configuration objects
 */
export const IdParser = z.string().refine((r) => ConfigId.getPrefix(r) != null);

/**
 * Base interface for all dynamo records
 *
 * all records should have these values.
 */
export const ConfigBase = z.object({
  /**
   * Primary key of the table
   *
   * Needs to be prefixed with the type {@link ConfigPrefix}
   *
   * @example
   * - "ts_aerial"
   * - "im_ada2b434dede4c64b782c1fd373bb0b9ac"
   */
  id: IdParser,

  /**
   * Slug friendly name for the objects
   *
   * @example
   * - "gebco_2023-305m"
   * - "taranaki-2022-2023-0.1m"
   */
  name: z.string(),

  /**
   * Timestamp when this object was last modified
   */
  updatedAt: z.number().optional(),

  /**
   * Was this configuration object generated from another object
   *
   * @default undefined
   */
  virtual: z.enum(['tileset-all', 'tileset-alias', 'imagery-name', 'imagery-id']).optional(),
});

export type ConfigBase = z.infer<typeof ConfigBase>;
