import { EpsgCode, ImageFormat } from '@basemaps/geo';
import { decodeTime, ulid } from 'ulid';

import { BasemapsConfigObject, BasemapsConfigProvider, ConfigId } from '../base.config.js';
import { sha256base58 } from '../base58.node.js';
import { BaseConfig } from '../config/base.js';
import { ConfigBundle } from '../config/config.bundle.js';
import { ConfigImagery } from '../config/imagery.js';
import { ConfigPrefix } from '../config/prefix.js';
import { ConfigProvider } from '../config/provider.js';
import { ConfigLayer, ConfigTileSet, TileSetType } from '../config/tile.set.js';
import { ConfigVectorStyle } from '../config/vector.style.js';
import { standardizeLayerName } from '../json/name.convertor.js';

interface DuplicatedImagery {
  id: string;
  name: string;
  projection: EpsgCode;
}

/** bundle the configuration as a single JSON object */
export interface ConfigBundled {
  id: string;
  /** Configuration hash */
  hash: string;
  /** Assets location */
  assets: string;
  imagery: ConfigImagery[];
  style: ConfigVectorStyle[];
  provider: ConfigProvider[];
  tileSet: ConfigTileSet[];
  duplicateImagery: DuplicatedImagery[];
}

function isConfigImagery(i: BaseConfig): i is ConfigImagery {
  return ConfigId.getPrefix(i.id) === ConfigPrefix.Imagery;
}

/** Get the last id from the s3 path and compare to get the latest id based on the timestamp */
function findLatestId(idA: string, idB: string): string {
  const ulidA = ConfigId.unprefix(ConfigPrefix.Imagery, idA);
  const ulidB = ConfigId.unprefix(ConfigPrefix.Imagery, idB);
  try {
    const timeA = decodeTime(ulidA);
    const timeB = decodeTime(ulidB);
    if (timeA >= timeB) return idA;
  } finally {
    //If not ulid return the return id alphabetically.
    return idA.localeCompare(idB) > 0 ? idA : idB;
  }
}

/** Force a unknown object into a Record<string, unknown> type */
export function isObject(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj !== 'object') return false;
  if (obj == null || Array.isArray(obj)) return false;
  return true;
}

/** Remove all "undefined" keys from a object */
function removeUndefined(obj: unknown): void {
  if (!isObject(obj)) return;
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) delete obj[key];
  }
}

export class ConfigProviderMemory extends BasemapsConfigProvider {
  type = 'memory' as const;

  Imagery = new MemoryConfigObject<ConfigImagery>(this, ConfigPrefix.Imagery);
  Style = new MemoryConfigObject<ConfigVectorStyle>(this, ConfigPrefix.Style);
  TileSet = new MemoryConfigObject<ConfigTileSet>(this, ConfigPrefix.TileSet);
  Provider = new MemoryConfigObject<ConfigProvider>(this, ConfigPrefix.Provider);
  ConfigBundle = new MemoryConfigObject<ConfigBundle>(this, ConfigPrefix.ConfigBundle);

  /** Memory cache of all objects */
  objects = new Map<string, BaseConfig>();

  /** Asset path from the config bundle */
  assets: string;

  /** Catch configs with the same imagery that using the different imagery ids. */
  duplicateImagery: DuplicatedImagery[] = [];

  put(obj: BaseConfig): void {
    this.objects.set(obj.id, obj);
  }

  toJson(): ConfigBundled {
    const cfg: ConfigBundled = {
      id: '',
      hash: '',
      assets: this.assets,
      imagery: [],
      style: [],
      provider: [],
      tileSet: [],
      duplicateImagery: this.duplicateImagery,
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

    cfg.hash = sha256base58(JSON.stringify(cfg));
    cfg.id = ConfigId.prefix(ConfigPrefix.ConfigBundle, ulid());

    return cfg;
  }

  /** Find all imagery inside this configuration and create a virtual tile set for it */
  createVirtualTileSets(): void {
    const allLayers: ConfigLayer[] = [];
    for (const obj of this.objects.values()) {
      if (isConfigImagery(obj)) {
        this.put(ConfigProviderMemory.imageryToTileSet(obj));
        const tileSet = this.imageryToTileSetByName(obj);
        allLayers.push(tileSet.layers[0]);
      }
    }
    // Create an all tileset contains all raster layers
    if (allLayers.length) this.createVirtualAllTileSet(allLayers);
  }
  createVirtualAllTileSet(layers: ConfigLayer[]): void {
    const layerByName = new Map<string, ConfigLayer>();
    // Set all layers as minZoom:32
    for (const l of layers) {
      const newLayer = { ...l, maxZoom: undefined, minZoom: 32 };
      layerByName.set(newLayer.name, { ...layerByName.get(l.name), ...newLayer });
    }
    const allTileset: ConfigTileSet = {
      type: TileSetType.Raster,
      id: 'ts_all',
      name: 'all',
      title: 'All Imagery',
      category: 'Basemaps',
      format: ImageFormat.Webp,
      layers: Array.from(layerByName.values()).sort((a, b) => a.name.localeCompare(b.name)),
    };
    this.put(allTileset);
  }

  /** Create a tileset by the standardized name */
  imageryToTileSetByName(i: ConfigImagery): ConfigTileSet {
    const targetName = standardizeLayerName(i.name);
    const targetId = ConfigId.prefix(ConfigPrefix.TileSet, targetName);
    let existing = this.objects.get(targetId) as ConfigTileSet;
    if (existing == null) {
      existing = {
        type: TileSetType.Raster,
        id: targetId,
        title: i.title,
        category: i.category,
        name: targetName,
        format: ImageFormat.Webp,
        layers: [{ name: targetName, title: i.title, minZoom: 0, maxZoom: 32 }],
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        updatedAt: Date.now(),
      } as ConfigTileSet;
      removeUndefined(existing);
      this.put(existing);
    }
    // The latest imagery overwrite the earlier ones.
    const existingImageryId = existing.layers[0][i.projection];
    if (existingImageryId) {
      const newId = findLatestId(i.id, existingImageryId);
      existing.layers[0][i.projection] = newId;
      if (newId !== existingImageryId) {
        this.duplicateImagery.push({ id: existingImageryId, name: i.name, projection: i.projection });
      }
    } else {
      existing.layers[0][i.projection] = i.id;
    }

    return existing;
  }

  /** Create a tile set of direct to imagery name `ts_imageId */
  static imageryToTileSet(i: ConfigImagery): ConfigTileSet {
    return {
      type: TileSetType.Raster,
      id: ConfigId.prefix(ConfigPrefix.TileSet, ConfigId.unprefix(ConfigPrefix.Imagery, i.id)),
      name: i.name,
      title: i.title,
      format: ImageFormat.Webp,
      layers: [{ [i.projection]: i.id, name: i.name, minZoom: 0, maxZoom: 32, title: i.title }],
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      updatedAt: Date.now(),
    };
  }

  /** Load a bundled configuration creating virtual tilesets for all imagery */
  static fromJson(cfg: ConfigBundled): ConfigProviderMemory {
    if (cfg.id == null || ConfigId.getPrefix(cfg.id) !== ConfigPrefix.ConfigBundle) {
      throw new Error('Provided configuration file is not a basemaps config bundle.');
    }
    // Load the time the bundle was created from the ULID
    const updatedAt = decodeTime(ConfigId.unprefix(ConfigPrefix.ConfigBundle, cfg.id));
    // TODO this should validate the config
    const mem = new ConfigProviderMemory();
    for (const ts of cfg.tileSet) mem.put(ts);
    for (const st of cfg.style) mem.put(st);
    for (const pv of cfg.provider) mem.put(pv);
    for (const img of cfg.imagery) mem.put(img);

    for (const obj of mem.objects.values()) obj.updatedAt = updatedAt;
    mem.assets = cfg.assets;

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
