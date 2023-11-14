import { BaseConfig } from './base.js';

export interface ConfigBundle extends BaseConfig {
  /** Path for the config bundle file */
  path: string;

  /** Hash of the config bundle file */
  hash: string;

  /** Path of the asset file */
  assets?: string;
}
