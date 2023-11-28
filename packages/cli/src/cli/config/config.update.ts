import {
  BaseConfig,
  BasemapsConfigProvider,
  ConfigImagery,
  ConfigPrefix,
  ConfigProvider,
  ConfigTileSet,
  ConfigVectorStyle,
} from '@basemaps/config';
import { BasemapsConfigObject, ConfigId } from '@basemaps/config';
import { ConfigDynamoBase, getDefaultConfig, LogConfig, LogType } from '@basemaps/shared';
import PLimit from 'p-limit';

import { ConfigDiff } from './config.diff.js';

export const Q = PLimit(10);

export class Updater<S extends BaseConfig = BaseConfig> {
  config: S;
  _oldData: Promise<ConfigImagery | ConfigTileSet | ConfigProvider | ConfigVectorStyle | null>;
  prefix: string;
  isCommit: boolean;
  logger: LogType;
  cfg: BasemapsConfigProvider;

  /**
   * Class to apply an TileSetConfig source to the tile metadata db
   * @param config a string or TileSetConfig to use
   */
  constructor(config: S, isCommit: boolean) {
    this.config = config;
    this.cfg = getDefaultConfig();
    const prefix = ConfigId.getPrefix(config.id);
    if (prefix == null) throw new Error(`Incorrect Config Id ${config.id}`);
    this.prefix = prefix;
    this.isCommit = isCommit ? isCommit : false;
    this.logger = LogConfig.get();
  }

  getDB(): BasemapsConfigObject<ConfigTileSet | ConfigImagery | ConfigProvider | ConfigVectorStyle> {
    if (this.prefix === ConfigPrefix.Imagery) return this.cfg.Imagery;
    if (this.prefix === ConfigPrefix.TileSet) return this.cfg.TileSet;
    if (this.prefix === ConfigPrefix.Provider) return this.cfg.Provider;
    if (this.prefix === ConfigPrefix.Style) return this.cfg.Style;
    throw Error(`Unable to find the database table for prefix ${this.prefix}`);
  }

  getConfig(): ConfigTileSet | ConfigImagery | ConfigProvider | ConfigVectorStyle {
    if (this.prefix === ConfigPrefix.Imagery) return this.config as unknown as ConfigImagery;
    if (this.prefix === ConfigPrefix.TileSet) return this.config as unknown as ConfigTileSet;
    if (this.prefix === ConfigPrefix.Provider) return this.config as unknown as ConfigProvider;
    if (this.prefix === ConfigPrefix.Style) return this.config as unknown as ConfigVectorStyle;
    throw Error(`Failed to cast the config ${this.config}`);
  }

  invalidatePath(): string {
    if (this.prefix === ConfigPrefix.Provider) return '/v1/*/WMTSCapabilities.xml';
    else if (this.prefix === ConfigPrefix.Style) return `/v1/tiles/togographic/style/${this.config.id.slice(3)}.json`;
    else return `/v1/tiles/${this.config.id.slice(3)}/*`;
  }

  getOldData(): Promise<ConfigImagery | ConfigTileSet | ConfigProvider | ConfigVectorStyle | null> {
    if (this._oldData) return this._oldData;
    this._oldData = this.getDB().get(this.config.id);
    return this._oldData;
  }

  /**
   * Reconcile the differences between the config and the tile metadata DB and update if changed.
   */
  async reconcile(): Promise<boolean> {
    const newData = this.getConfig();
    const db = this.getDB();
    const oldData = await this.getOldData();
    if (oldData == null || ConfigDiff.showDiff(db.prefix, oldData, newData, this.logger)) {
      const operation = oldData == null ? 'Insert' : 'Update';
      this.logger.info({ type: db.prefix, record: newData.id, commit: this.isCommit }, `Change:${operation}`);
      if (this.isCommit) {
        if (db instanceof ConfigDynamoBase) await db.put(newData);
        else throw new Error('Unable to commit changes to: ' + db.prefix);
      }
      return true;
    }
    this.logger.trace({ type: db.prefix, record: newData.id }, 'NoChanges');
    return false;
  }
}
