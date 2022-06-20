import {
  BaseConfig,
  ConfigDynamoBase,
  Config,
  ConfigTileSet,
  ConfigImagery,
  ConfigProvider,
  ConfigVectorStyle,
} from '@basemaps/config';
import { BasemapsConfigObject } from '@basemaps/config/build/base.config.js';
import { LogConfig, LogType } from '@basemaps/shared';
import { ConfigDiff } from './config.diff.js';
import PLimit from 'p-limit';

export const Q = PLimit(10);

export class Updater<S extends BaseConfig = BaseConfig> {
  config: S;
  prefix: string;
  isCommit: boolean;
  logger: LogType;

  /**
   * Class to apply an TileSetConfig source to the tile metadata db
   * @param config a string or TileSetConfig to use
   */
  constructor(config: S, isCommit: boolean) {
    this.config = config;
    this.prefix = config.id.slice(0, 2);
    this.isCommit = isCommit ? isCommit : false;
    this.logger = LogConfig.get();
  }

  getDB(): BasemapsConfigObject<ConfigTileSet | ConfigImagery | ConfigProvider | ConfigVectorStyle> {
    if (this.prefix === 'im') return Config.Imagery;
    if (this.prefix === 'ts') return Config.TileSet;
    if (this.prefix === 'pv') return Config.Provider;
    if (this.prefix === 'st') return Config.Style;
    throw Error(`Unable to find the database table for prefix ${this.prefix}`);
  }

  getConfig(): ConfigTileSet | ConfigImagery | ConfigProvider | ConfigVectorStyle {
    if (this.prefix === 'im') return this.config as unknown as ConfigImagery;
    if (this.prefix === 'ts') return this.config as unknown as ConfigTileSet;
    if (this.prefix === 'pv') return this.config as unknown as ConfigProvider;
    if (this.prefix === 'st') return this.config as unknown as ConfigVectorStyle;
    throw Error(`Failed to cast the config ${this.config}`);
  }

  invalidatePath(): string {
    if (this.prefix === 'pv') return '/v1/*/WMTSCapabilities.xml';
    else if (this.prefix === 'st') return '/v1/tiles/togographic/style/${this.getId().slice(3)}.json';
    else return `/v1/tiles/${this.config.id.slice(3)}/*`;
  }

  /**
   * Reconcile the differences between the config and the tile metadata DB and update if changed.
   */
  async reconcile(): Promise<boolean> {
    const db = this.getDB();

    const oldData = await db.get(this.config.id);
    const newData = this.getConfig();

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
