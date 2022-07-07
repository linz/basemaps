import { ImageFormat } from '@basemaps/geo';
import { BasemapsConfigObject, BasemapsConfigProvider, Config } from '../base.config.js';
import { BaseConfig } from '../config/base.js';
import { ConfigImagery } from '../config/imagery.js';
import { ConfigPrefix } from '../config/prefix.js';
import { ConfigProcessingJob } from '../config/processing.job.js';
import { ConfigProvider } from '../config/provider.js';
import { ConfigTileSet, TileSetType } from '../config/tile.set.js';
import { ConfigVectorStyle } from '../config/vector.style.js';
import { ulid, decodeTime } from 'ulid';
import { createHash } from 'crypto';
import { standardizeLayerName } from '../json/name.convertor.js';

/** bundle the configuration as a single JSON object */
export interface ConfigBundled {
  id: string;
  /** Configuration hash */
  hash: string;
  imagery: ConfigImagery[];
  style: ConfigVectorStyle[];
  provider: ConfigProvider[];
  tileSet: ConfigTileSet[];
}

function isConfigImagery(i: BaseConfig): i is ConfigImagery {
  return Config.getPrefix(i.id) === ConfigPrefix.Imagery;
}

export class ConfigProviderMemory extends BasemapsConfigProvider {
  type: 'memory' = 'memory';

  Imagery = new MemoryConfigObject<ConfigImagery>(this, ConfigPrefix.Imagery);
  Style = new MemoryConfigObject<ConfigVectorStyle>(this, ConfigPrefix.Style);
  TileSet = new MemoryConfigObject<ConfigTileSet>(this, ConfigPrefix.TileSet);
  Provider = new MemoryConfigObject<ConfigProvider>(this, ConfigPrefix.Provider);
  ProcessingJob = new MemoryConfigObject<ConfigProcessingJob>(this, ConfigPrefix.ProcessingJob);

  /** Memory cache of all objects */
  objects = new Map<string, BaseConfig>();

  put(obj: BaseConfig): void {
    this.objects.set(obj.id, obj);
  }

  toJson(): ConfigBundled {
    const cfg: ConfigBundled = {
      id: '',
      hash: '',
      imagery: [],
      style: [],
      provider: [],
      tileSet: [],
    };

    for (const val of this.objects.values()) {
      const prefix = val.id.slice(0, val.id.indexOf('_'));
      delete val.updatedAt;
      switch (prefix) {
        case ConfigPrefix.Imagery:
          cfg.imagery.push(val as ConfigImagery);
          break;
        case ConfigPrefix.Style:
          cfg.style.push(val as ConfigVectorStyle);
          break;
        case ConfigPrefix.Provider:
          cfg.provider.push(val as ConfigProvider);
          break;
        case ConfigPrefix.TileSet:
          cfg.tileSet.push(val as ConfigTileSet);
          break;
        default:
          throw new Error('Unable to parse configuration id: ' + val.id);
      }
    }

    cfg.hash = createHash('sha256').update(JSON.stringify(cfg)).digest('base64url');
    cfg.id = Config.prefix(ConfigPrefix.ConfigBundle, ulid());

    return cfg;
  }

  /** Find all imagery inside this configuration and create a virtual tile set for it */
  createVirtualTileSets(): void {
    for (const obj of this.objects.values()) {
      if (!isConfigImagery(obj)) continue;
      const ts = ConfigProviderMemory.imageryToTileSet(obj);
      // TODO should this really overwrite existing tilesets
      this.put(ts);
      this.imageryToTileSetName(obj);
    }
  }

  /** Create a tileset by the standardized name */
  imageryToTileSetName(i: ConfigImagery): void {
    const targetName = standardizeLayerName(i.name);
    const targetId = Config.prefix(ConfigPrefix.TileSet, targetName);
    let existing = this.objects.get(targetId) as ConfigTileSet;
    if (existing == null) {
      existing = {
        type: TileSetType.Raster,
        id: targetId,
        name: targetName,
        format: ImageFormat.Webp,
        layers: [{ name: targetName, minZoom: 0, maxZoom: 32 }],
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        updatedAt: Date.now(),
      } as ConfigTileSet;
      this.put(existing);
    }
    // TODO this overwrites existing layers
    existing.layers[0][i.projection] = i.id;
  }

  static imageryToTileSet(i: ConfigImagery): ConfigTileSet {
    return {
      type: TileSetType.Raster,
      id: Config.prefix(ConfigPrefix.TileSet, Config.unprefix(ConfigPrefix.Imagery, i.id)),
      name: i.name,
      format: ImageFormat.Webp,
      layers: [{ [i.projection]: i.id, name: i.name, minZoom: 0, maxZoom: 32 }],
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      updatedAt: Date.now(),
    };
  }

  /** Load a bundled configuration creating virtual tilesets for all imagery */
  static fromJson(cfg: ConfigBundled): ConfigProviderMemory {
    if (cfg.id == null || Config.getPrefix(cfg.id) !== ConfigPrefix.ConfigBundle) {
      throw new Error('Provided configuration file is not a basemaps config bundle.');
    }
    // Load the time the bundle was created from the ULID
    const updatedAt = decodeTime(Config.unprefix(ConfigPrefix.ConfigBundle, cfg.id));
    // TODO this should validate the config
    const mem = new ConfigProviderMemory();
    for (const ts of cfg.tileSet) mem.put(ts);
    for (const st of cfg.style) mem.put(st);
    for (const pv of cfg.provider) mem.put(pv);
    for (const img of cfg.imagery) mem.put(img);

    for (const obj of mem.objects.values()) obj.updatedAt = updatedAt;

    return mem;
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