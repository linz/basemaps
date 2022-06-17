import { BaseConfig, ConfigDynamoBase } from '@basemaps/config';
import { BasemapsConfigObject } from '@basemaps/config/build/base.config';
import { LogConfig, LogType } from '@basemaps/shared';
import { ConfigDiff } from './config.diff.js';
import PLimit from 'p-limit';

export const Q = PLimit(10);

export abstract class Updater<S extends BaseConfig = BaseConfig> {
  id: string;
  config: S;
  isCommit: boolean;
  logger: LogType;

  abstract db: BasemapsConfigObject<S>;

  /**
   * Class to apply an TileSetConfig source to the tile metadata db
   * @param config a string or TileSetConfig to use
   */
  constructor(config: S, isCommit: boolean) {
    this.config = config;
    this.isCommit = isCommit ? isCommit : false;
    this.id = this.config.id;
    this.logger = LogConfig.get();
  }

  abstract prepareNewData(oldData: S | null): S;

  invalidatePath?(): string;

  getId(): string {
    return this.db.id(this.config.id);
  }

  /**
   * Reconcile the differences between the config and the tile metadata DB and update if changed.
   */
  async reconcile(): Promise<boolean> {
    if (!this.id.startsWith(this.db.prefix)) throw new Error(`Invalid id:${this.id}, missing prefix:${this.db.prefix}`);

    const oldData = await this.db.get(this.getId());
    const newData = this.prepareNewData(oldData);

    if (oldData == null || ConfigDiff.showDiff(this.db.prefix, oldData, newData, this.logger)) {
      const operation = oldData == null ? 'Insert' : 'Update';
      this.logger.info({ type: this.db.prefix, record: newData.id, commit: this.isCommit }, `Change:${operation}`);
      if (this.isCommit) {
        if (this.db instanceof ConfigDynamoBase) await this.db.put(newData);
        else throw new Error('Unable to commit changes to: ' + this.db.prefix);
      }
      return true;
    }
    this.logger.trace({ type: this.db.prefix, record: newData.id }, 'NoChanges');
    return false;
  }
}
