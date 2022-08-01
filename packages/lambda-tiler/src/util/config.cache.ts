import { ConfigBundled, ConfigProviderMemory } from '@basemaps/config';
import { fsa } from '@chunkd/fs';
import { SwappingLru } from './swapping.lru.js';

class LruConfig {
  value: ConfigProviderMemory;

  constructor(mem: ConfigProviderMemory) {
    this.value = mem;
  }

  get size(): number {
    return JSON.stringify(this.value.toJson()).length;
  }
}

export class ConfigCache {
  cache: SwappingLru<LruConfig>;
  constructor(maxSize: number) {
    this.cache = new SwappingLru<LruConfig>(maxSize);
  }

  async getConfig(location: string): Promise<ConfigProviderMemory | null> {
    const existing = this.cache.get(location)?.value;
    if (existing != null) return existing;
    try {
      const configJson = await fsa.readJson<ConfigBundled>(location);
      const mem = ConfigProviderMemory.fromJson(configJson);
      mem.createVirtualTileSets();
      this.cache.set(location, new LruConfig(mem));
      return mem;
    } catch (e: any) {
      if (e.code === 404) return null;
      throw e;
    }
  }
}

/** Approx 10MB around 20 configs(less than 500KB each)*/
export const CachedConfig = new ConfigCache(10 * 1000 * 1000);
