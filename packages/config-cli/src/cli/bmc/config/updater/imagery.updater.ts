import { Config, ConfigImagery } from '@basemaps/config';
import { Updater } from '../base.config.js';

export class ImageryUpdater extends Updater<ConfigImagery> {
  db = Config.Imagery;

  prepareNewData(oldData: ConfigImagery | null): ConfigImagery {
    const now = Date.now();

    const imagery: ConfigImagery = {
      id: this.getId(),
      name: this.config.name,
      tileMatrix: this.config.tileMatrix,
      projection: this.config.projection,
      uri: this.config.uri,
      bounds: this.config.bounds,
      files: this.config.files,
      createdAt: oldData ? oldData.createdAt : now,
      updatedAt: now,
    };

    return imagery;
  }

  invalidatePath(): string {
    return `/v1/tiles/${this.getId().slice(3)}/*`;
  }
}
