import { Epsg } from '@basemaps/geo';
import { BaseConfig } from './config/base.js';
import { ConfigPrefix } from './config/prefix.js';
import { ConfigLayer, ConfigTileSet, TileSetType } from './config/tile.set.js';
import {
  ConfigImagery,
  ConfigProvider,
  ConfigTileSetRaster,
  ConfigTileSetVector,
  ConfigVectorStyle,
  ConfigProcessingJob,
} from './index.js';

export class ConfigInstance {
  cfg: BasemapsConfigProvider;

  get TileSet(): BasemapsConfigObject<ConfigTileSet> {
    return this.cfg.TileSet;
  }

  get Imagery(): BasemapsConfigObject<ConfigImagery> {
    return this.cfg.Imagery;
  }

  get Style(): BasemapsConfigObject<ConfigVectorStyle> {
    return this.cfg.Style;
  }

  get Provider(): BasemapsConfigObject<ConfigProvider> {
    return this.cfg.Provider;
  }

  get ProcessingJob(): BasemapsConfigObject<ConfigProcessingJob> {
    return this.cfg.ProcessingJob;
  }

  setConfigProvider(cfg: BasemapsConfigProvider): void {
    this.cfg = cfg;
  }

  isTileSetRaster(s: ConfigTileSet | null): s is ConfigTileSetRaster {
    if (s == null) return false;
    return s.type == null || s.type === TileSetType.Raster;
  }

  isTileSetVector(s: ConfigTileSet | null): s is ConfigTileSetVector {
    if (s == null) return false;
    return s.type === TileSetType.Vector;
  }

  async getAllImagery(layers: ConfigLayer[], projection: Epsg): Promise<Map<string, ConfigImagery>> {
    const imgIds = new Set<string>();
    for (const layer of layers) {
      const imgId = layer[projection.code];
      if (imgId) imgIds.add(this.Imagery.id(imgId));
    }
    return this.Imagery.getAll(imgIds);
  }

  /**
   * Prefix a dynamoDb id with the provided prefix if it doesnt already start with it.
   */
  prefix(prefix: ConfigPrefix, id: string): string {
    if (id === '') return id;
    if (id.startsWith(prefix)) return id;
    return `${prefix}_${id}`;
  }

  /**
   * Remove the prefix from a dynamoDb id
   */
  unprefix(prefix: ConfigPrefix, id: string): string {
    if (id.startsWith(prefix)) return id.slice(3);
    return id;
  }
}

export abstract class BasemapsConfigProvider {
  abstract TileSet: BasemapsConfigObject<ConfigTileSet>;
  abstract Imagery: BasemapsConfigObject<ConfigImagery>;
  abstract Style: BasemapsConfigObject<ConfigVectorStyle>;
  abstract Provider: BasemapsConfigObject<ConfigProvider>;
  abstract ProcessingJob: BasemapsConfigObject<ConfigProcessingJob>;
}

export abstract class BasemapsConfigObject<T extends BaseConfig> {
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
  is(obj?: BaseConfig | null): obj is T {
    return obj != null && obj.id.startsWith(this.prefix);
  }

  /** Fetch a single object from the store */
  abstract get(id: string): Promise<T | null>;
  /** Fetch all objects from the store */
  abstract getAll(id: Set<string>): Promise<Map<string, T>>;
}

export interface BaseConfigWriteableObject<T extends BaseConfig> extends BasemapsConfigObject<T> {
  put(record: T): Promise<string>;
}

export const Config = new ConfigInstance();
