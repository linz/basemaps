import { Config, ConfigProvider } from '@basemaps/config';
import { Updater } from '../base.config.js';

export class ProviderUpdater extends Updater<ConfigProvider> {
  db = Config.Provider;

  prepareNewData(oldData: ConfigProvider | null): ConfigProvider {
    const now = Date.now();

    const provider: ConfigProvider = {
      id: this.getId(),
      name: Config.unprefix(this.db.prefix, this.config.id),
      serviceIdentification: this.config.serviceIdentification,
      serviceProvider: this.config.serviceProvider,
      createdAt: oldData ? oldData.createdAt : now,
      updatedAt: now,
      version: 1,
    };

    return provider;
  }

  invalidatePath(): string {
    return '/v1/*/WMTSCapabilities.xml';
  }
}
