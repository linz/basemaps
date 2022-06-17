import { Env, fsa, LogConfig } from '@basemaps/shared';
import { ConfigBundled, ConfigImagery, ConfigProvider, ConfigTileSet, ConfigVectorStyle } from '@basemaps/config';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { Q, Updater } from './config/base.config.js';
import { StyleUpdater } from './config/updater/style.updater.js';
import { ProviderUpdater } from './config/updater/provider.updater.js';
import { TileSetUpdater } from './config/updater/tileset.updater.js';
import { invalidateCache } from '@basemaps/cli/build/cli/util.js';
import { ImageryUpdater } from './config/updater/imagery.updater.js';
import { ImageryTileSetUpdater } from './config/updater/imagery.tileset.updater.js';

export enum UpdaterType {
  Style = 'style',
  TileSet = 'tileset',
  Imagery = 'imagery',
  ImageryTileSet = 'imagery_tileset',
  Provider = 'provider',
}

export class CommandImport extends CommandLineAction {
  private config: CommandLineStringParameter;
  private commit: CommandLineFlagParameter;

  promises: Promise<boolean>[] = [];
  /** List of paths to invalidate at the end of the request */
  invalidations: string[] = [];

  public constructor() {
    super({
      actionName: 'import',
      summary: 'import a config json into dynamodb',
      documentation: 'Given a valid bundle config json and import them into dynamodb',
    });
  }

  protected onDefineParameters(): void {
    this.config = this.defineStringParameter({
      argumentName: 'CONFIG',
      parameterLongName: '--config',
      description: 'Path of config json',
      required: true,
    });
    this.commit = this.defineFlagParameter({
      parameterLongName: '--commit',
      description: 'Actually start the import',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    logger.level = 'trace';
    const commit = this.commit.value ?? false;
    const config = this.config.value;
    if (config == null) throw new Error('Please provide a config json');

    const HostPrefix = Env.isProduction() ? '' : 'dev.';
    const healthEndpoint = `https://${HostPrefix}basemaps.linz.govt.nz/v1/health`;

    logger.info({ url: healthEndpoint }, 'Import:ValidateHealth');
    if (commit) {
      const res = await fetch(healthEndpoint);
      if (!res.ok) throw new Error('Cannot update basemaps is unhealthy');
    }

    logger.info({ config: config }, 'Import:Load');
    const configJson = await fsa.readJson<ConfigBundled>(config);

    logger.info({ config: config }, 'Import:Style');
    for await (const config of configJson.style) this.update(UpdaterType.Style, config, commit);

    logger.info({ config: config }, 'Import:Provider');
    for await (const config of configJson.provider) this.update(UpdaterType.Provider, config, commit);

    logger.info({ config: config }, 'Import:TileSet');
    for await (const config of configJson.tileSet) this.update(UpdaterType.TileSet, config, commit);

    logger.info({ config: config }, 'Import:Imagery');
    for await (const config of configJson.imagery) this.update(UpdaterType.Imagery, config, commit);

    logger.info({ config: config }, 'Import:ImageryTileSet');
    for await (const config of configJson.imagery) this.update(UpdaterType.ImageryTileSet, config, commit);

    if (commit && this.invalidations.length > 0) {
      // Lots of invalidations just invalidate everything
      if (this.invalidations.length > 10) {
        await invalidateCache('/*', commit);
      } else {
        await invalidateCache(this.invalidations, commit);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await fetch(healthEndpoint);
      if (!res.ok) throw new Error('Basemaps is unhealthy');
    }

    if (commit !== true) logger.info('DryRun:Done');
  }

  getUpdater(type: UpdaterType, config: unknown, commit: boolean): Updater | ImageryTileSetUpdater {
    if (type === UpdaterType.Style) return new StyleUpdater(config as ConfigVectorStyle, commit);
    if (type === UpdaterType.Provider) return new ProviderUpdater(config as ConfigProvider, commit);
    if (type === UpdaterType.TileSet) return new TileSetUpdater(config as ConfigTileSet, commit);
    if (type === UpdaterType.Imagery) return new ImageryUpdater(config as ConfigImagery, commit);
    if (type === UpdaterType.ImageryTileSet) return new ImageryTileSetUpdater(config as ConfigImagery, commit);
    throw new Error(`Unable to find updater for type:${type}`);
  }

  update(type: UpdaterType, config: unknown, commit: boolean): void {
    const promise = Q(async (): Promise<boolean> => {
      const updater = this.getUpdater(type, config, commit);
      const hasChanges = await updater.reconcile();
      if (hasChanges && updater.invalidatePath) this.invalidations.push(updater.invalidatePath());

      return true;
    });
    this.promises.push(promise);
  }
}
