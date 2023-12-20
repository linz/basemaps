import { z } from 'zod';

import { ConfigBase } from './base.js';

export const ConfigBundleParser = ConfigBase.extend({
  /**
   * path to the configuration bundle
   *
   * This should be a full URL
   *
   * @example
   * - "s3://linz-basemaps/config/config-latest.gz"
   */
  path: z.string(),
  /**
   * sha256base58 hash of the configuration
   *
   * {@link sha256base58}
   *
   * @example
   * - "HPV7UAB97VZXMs7iryoPYksxRNEbbBsvroyvTak4vSjt"
   */
  hash: z.string(),

  /**
   * Location to the assets are all the fonts and sprites, this is generally
   * a cotar {@link https://github.com/linz/cotar}
   *
   * @example
   * - "s3://linz-basemaps/assets/assets-HPV7UAB97VZXMs7iryoPYksxRNEbbBsvroyvTak4vSjt.tar.co"
   */
  assets: z.string().optional(),
});

export type ConfigBundle = z.infer<typeof ConfigBundleParser>;
