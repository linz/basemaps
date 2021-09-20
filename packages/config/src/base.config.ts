import { Epsg, EpsgCode } from '@basemaps/geo';
import { ConfigImagery, ConfigProvider, ConfigTileSetRaster, ConfigTileSetVector, ConfigVectorStyle } from './index.js';
import { BaseConfig } from './config/base.js';
import { ConfigPrefix } from './config/prefix.js';
import { ConfigLayer, ConfigTileSet, TileSetType } from './config/tile.set.js';

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

  async getImagery(layer: ConfigLayer, projection: Epsg): Promise<ConfigImagery | null> {
    if (projection.code === EpsgCode.Nztm2000 && layer[2193]) return this.Imagery.get(this.Imagery.id(layer[2193]));
    if (projection.code === EpsgCode.Google && layer[3857]) return this.Imagery.get(this.Imagery.id(layer[3857]));
    return null;
  }

  async getAllImagery(layers: ConfigLayer[], projection: Epsg): Promise<Map<string, ConfigImagery>> {
    const output = new Map<string, ConfigImagery>();
    // Get Imagery based on the order of rules. Imagery priority are ordered by on rules.
    for (const layer of layers) {
      const imgId = layer[projection.code];
      if (imgId == null) continue;
      // TODO this await should not be in the middle of a loop
      const img = await this.Imagery.get(this.Imagery.id(imgId));
      if (img == null) continue;
      output.set(imgId, img);
    }

    return output;
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
    if (id.startsWith(prefix)) return id.substr(3);
    return id;
  }

  /** Get all imagery for a tile set */
  getTileSetImagery(rec: ConfigTileSetRaster): Promise<Map<string, ConfigImagery>> {
    const imgIds = new Set<string>();
    for (const layer of rec.layers) {
      if (layer[2193] != null) imgIds.add(layer[2193]);
      if (layer[3857] != null) imgIds.add(layer[3857]);
    }
    return this.Imagery.getAll(imgIds);
  }

  /** Get the imageId from a layer for a specific projection */
  getImageId(layer: ConfigLayer, projection: Epsg): string | undefined {
    return layer[projection.code];
  }
}

export abstract class BasemapsConfigProvider {
  abstract TileSet: BasemapsConfigObject<ConfigTileSet>;
  abstract Imagery: BasemapsConfigObject<ConfigImagery>;
  abstract Style: BasemapsConfigObject<ConfigVectorStyle>;
  abstract Provider: BasemapsConfigObject<ConfigProvider>;
}

export abstract class BasemapsConfigObject<T extends BaseConfig> {
  prefix: ConfigPrefix;

  constructor(prefix: ConfigPrefix) {
    this.prefix = prefix;
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

export const Config = new ConfigInstance();
