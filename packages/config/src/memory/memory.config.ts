import { BasemapsConfigProvider, BasemapsConfigObject } from '../base.config.js';
import { BaseConfig } from '../config/base.js';
import { ConfigImagery } from '../config/imagery.js';
import { CogCreation } from '../config/cog.creation.js';
import { ConfigPrefix } from '../config/prefix.js';
import { ConfigProvider } from '../config/provider.js';
import { ConfigTileSet } from '../config/tile.set.js';
import { ConfigVectorStyle } from '../config/vector.style.js';

export class ConfigProviderMemory extends BasemapsConfigProvider {
  Imagery = new MemoryConfigObject<ConfigImagery>(this, ConfigPrefix.Imagery);
  Style = new MemoryConfigObject<ConfigVectorStyle>(this, ConfigPrefix.Style);
  TileSet = new MemoryConfigObject<ConfigTileSet>(this, ConfigPrefix.TileSet);
  Provider = new MemoryConfigObject<ConfigProvider>(this, ConfigPrefix.Provider);
  CogCreation = new MemoryConfigObject<CogCreation>(this, ConfigPrefix.CogCreation);

  /** Memory cache of all objects */
  objects = new Map<string, BaseConfig>();

  put(obj: BaseConfig): void {
    this.objects.set(obj.id, obj);
  }
}

export class MemoryConfigObject<T extends BaseConfig> extends BasemapsConfigObject<T> {
  prefix: ConfigPrefix;
  cfg: ConfigProviderMemory;

  constructor(cfg: ConfigProviderMemory, prefix: ConfigPrefix) {
    super(prefix);
    this.cfg = cfg;
  }

  async get(id: string): Promise<T | null> {
    const obj = this.cfg.objects.get(this.id(id));
    if (this.is(obj)) return obj;
    return null;
  }

  async getAll(ids: Set<string>): Promise<Map<string, T>> {
    const map = new Map<string, T>();
    for (const id of ids) {
      const obj = await this.get(id);
      if (obj == null) continue;
      map.set(id, obj);
    }
    return map;
  }
}
