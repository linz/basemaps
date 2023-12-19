import { Epsg } from '@basemaps/geo';

import { ConfigBase } from './config/base.js';
import { ConfigBundle } from './config/config.bundle.js';
import { ConfigPrefix, ConfigPrefixes } from './config/prefix.js';
import { ConfigLayer, ConfigTileSet } from './config/tile.set.js';
import { ConfigImagery, ConfigProvider, ConfigVectorStyle } from './index.js';

export abstract class BasemapsConfigProvider {
  abstract type: string;
  /** Location of the assets (Sprites/glyphs) */
  assets?: string;
  abstract TileSet: BasemapsConfigObject<ConfigTileSet>;
  abstract Imagery: BasemapsConfigObject<ConfigImagery>;
  abstract Style: BasemapsConfigObject<ConfigVectorStyle>;
  abstract Provider: BasemapsConfigObject<ConfigProvider>;
  abstract ConfigBundle: BasemapsConfigObject<ConfigBundle>;
}

export abstract class BasemapsConfigObject<T extends ConfigBase> {
  prefix: ConfigPrefix;

  constructor(prefix: ConfigPrefix) {
    this.prefix = prefix;
  }

  /**
   * Can this config object be written to with this.put()
   * @example
   * ```typescript
   * if (this.isWriteable()) return this.put(obj)
   * ```
   *
   * @returns true if writeable false otherwise
   */
  isWriteable(): this is BaseConfigWriteableObject<T> {
    return false;
  }

  /** Create a prefixed id for a object */
  id(name: string): string {
    if (name.startsWith(`${this.prefix}_`)) return name;
    return `${this.prefix}_${name}`;
  }
  /** Is this object one of these objects */
  is(obj?: ConfigBase | null): obj is T {
    return obj != null && obj.id.startsWith(this.prefix);
  }

  /** Fetch a single object from the store */
  abstract get(id: string): Promise<T | null>;
  /** Fetch all objects from the store */
  abstract getAll(id: Set<string>): Promise<Map<string, T>>;
}

export interface BaseConfigWriteableObject<T extends ConfigBase> extends BasemapsConfigObject<T> {
  put(record: T): Promise<string>;
}

export const ConfigId = {
  /**
   * Prefix a dynamoDb id with the provided prefix if it doesnt already start with it.
   */
  prefix(prefix: ConfigPrefix, id: string): string {
    if (id === '') return id;
    if (id.startsWith(prefix)) return id;
    return `${prefix}_${id}`;
  },

  /** Attempt to get the configuration prefix from a id */
  getPrefix(id: string): ConfigPrefix | null {
    const joinIndex = id.indexOf('_');
    if (joinIndex === -1) return null;
    const prefix = id.slice(0, joinIndex) as ConfigPrefix;
    if (ConfigPrefixes.has(prefix)) return prefix;
    return null;
  },

  /**
   * Remove the prefix from a dynamoDb id
   */
  unprefix(prefix: ConfigPrefix, id: string): string {
    if (id.startsWith(prefix)) return id.slice(3);
    return id;
  },
};

export async function getAllImagery(
  provider: BasemapsConfigProvider,
  layers: ConfigLayer[],
  projections: Epsg[],
): Promise<Map<string, ConfigImagery>> {
  const imgIds = new Set<string>();
  for (const projection of projections) {
    for (const layer of layers) {
      const imgId = layer[projection.code];
      if (imgId) imgIds.add(provider.Imagery.id(imgId));
    }
  }
  return provider.Imagery.getAll(imgIds);
}
