import { Config, ConfigVectorStyle, StyleJson } from '@basemaps/config';
import { Updater } from '../base.config.js';

export class StyleUpdater extends Updater<ConfigVectorStyle> {
  db = Config.Style;

  prepareNewData(oldData: ConfigVectorStyle | null): ConfigVectorStyle {
    const now = Date.now();

    const style: ConfigVectorStyle = {
      id: this.getId(),
      name: this.config.name,
      style: this.config.style as StyleJson,
      createdAt: oldData ? oldData.createdAt : now,
      updatedAt: now,
    };

    return style;
  }

  invalidatePath(): string {
    return `/v1/tiles/togographic/style/${this.getId().slice(3)}.json`;
  }
}
