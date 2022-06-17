import {
  Config,
  ConfigDynamoBase,
  ConfigImagery,
  ConfigPrefix,
  ConfigTileSet,
  ConfigTileSetRaster,
  TileSetType,
} from '@basemaps/config';
import { ImageFormat } from '@basemaps/geo';
import { LogType, LogConfig } from '@basemaps/shared';
import { ConfigDiff } from '../config.diff.js';

export class ImageryTileSetUpdater {
  id: string;
  config: ConfigImagery;
  isCommit: boolean;
  logger: LogType;
  db = Config.TileSet;

  constructor(config: ConfigImagery, isCommit: boolean) {
    this.config = config;
    this.isCommit = isCommit ? isCommit : false;
    this.id = this.getTsId();
    this.logger = LogConfig.get();
  }

  getTsId(): string {
    const imId = this.config.id;
    const tsId = imId.replace(ConfigPrefix.Imagery, ConfigPrefix.TileSet);
    return tsId;
  }

  prepareNewData(oldData: ConfigTileSet | null): ConfigTileSetRaster {
    const now = Date.now();
    const imId = this.config.id;
    const tsId = this.getTsId();
    const imagery: ConfigTileSetRaster = {
      id: tsId,
      type: TileSetType.Raster,
      format: ImageFormat.Webp,
      name: this.config.name,
      layers: [{ [this.config.projection]: imId, name: this.config.name, minZoom: 0, maxZoom: 32 }],
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      createdAt: oldData ? oldData.createdAt : now,
      updatedAt: now,
    };

    return imagery;
  }

  invalidatePath(): string {
    return `/v1/tiles/${this.getTsId().slice(3)}/*`;
  }

  /**
   * Reconcile the differences between the config and the tile metadata DB and update if changed.
   */
  async reconcile(): Promise<boolean> {
    if (!this.id.startsWith(this.db.prefix)) throw new Error(`Invalid id:${this.id}, missing prefix:${this.db.prefix}`);

    const oldData = await this.db.get(this.getTsId());
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
