import { BaseConfig } from './base.js';

export interface ConfigBundle extends BaseConfig {
  /** Path for the config bundle file */
  path: string;

  /** Path for the Asset file */
  assets: string;

  /** Hash of the config bundle file */
  hash: string;
}
