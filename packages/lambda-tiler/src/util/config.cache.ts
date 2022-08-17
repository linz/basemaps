import { ConfigBundled, ConfigProviderMemory } from '@basemaps/config';
import { fsa } from '@chunkd/fs';
import { SwappingLru } from './swapping.lru.js';

class LruConfig {
  configProvider: Promise<ConfigProviderMemory>;

  constructor(config: Promise<ConfigBundled>) {
    this.configProvider = config.then((c) => {
      const configProvider = ConfigProviderMemory.fromJson(c);
      configProvider.createVirtualTileSets();
      return configProvider;
    });
  }

  get size(): number {
    // Return size 1 for the config and cache the number of configs based on size number.
    return 1;
  }
}

export class ConfigCache {
  cache: SwappingLru<LruConfig>;
  constructor(maxSize: number) {
    this.cache = new SwappingLru<LruConfig>(maxSize);
  }

  get(location: string): Promise<ConfigProviderMemory | null> {
    const existing = this.cache.get(location)?.configProvider;
    if (existing != null) return existing;
    try {
      const configJson = fsa.readJson<ConfigBundled>(location);
      const config = new LruConfig(configJson);
      this.cache.set(location, config);
      return config.configProvider;
    } catch (e: any) {
      if (e.code === 404) return Promise.resolve(null);
      throw e;
    }
  }
}

/** Cache 20 configs(Around 500KB each)*/
export const CachedConfig = new ConfigCache(20);
