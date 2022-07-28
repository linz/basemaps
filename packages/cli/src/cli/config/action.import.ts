import { Env, fsa, LogConfig } from '@basemaps/shared';
import { BaseConfig, Config, ConfigBundle, ConfigBundled, ConfigProviderMemory } from '@basemaps/config';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { Q, Updater } from './config.update.js';
import { invalidateCache } from '../util.js';
import fetch from 'node-fetch';

export class CommandImport extends CommandLineAction {
  private config: CommandLineStringParameter;
  private backup: CommandLineStringParameter;
  private commit: CommandLineFlagParameter;

  promises: Promise<boolean>[] = [];
  /** List of paths to invalidate at the end of the request */
  invalidations: string[] = [];
  /** List of paths to invalidate at the end of the request */
  backupConfig: ConfigProviderMemory = new ConfigProviderMemory();

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
      description: 'Path of config json, this can be both a local path or s3 location',
      required: true,
    });
    this.backup = this.defineStringParameter({
      argumentName: 'BACKUP',
      parameterLongName: '--backup',
      description: 'Backup the old config into a config bundle json',
    });
    this.commit = this.defineFlagParameter({
      parameterLongName: '--commit',
      description: 'Actually start the import',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const commit = this.commit.value ?? false;
    const config = this.config.value;
    const backup = this.backup.value;
    if (config == null) throw new Error('Please provide a config json');
    if (commit && !config.startsWith('s3://')) {
      throw new Error('To actually import into dynamo has to use the config file from s3.');
    }

    const HostPrefix = Env.isProduction() ? '' : 'dev.';
    const healthEndpoint = `https://${HostPrefix}basemaps.linz.govt.nz/v1/health`;

    logger.info({ url: healthEndpoint }, 'Import:ValidateHealth');
    if (commit) {
      const res = await fetch(healthEndpoint);
      if (!res.ok) throw new Error('Cannot update basemaps is unhealthy');
    }

    logger.info({ config }, 'Import:Load');
    const configJson = await fsa.readJson<ConfigBundled>(config);
    const mem = ConfigProviderMemory.fromJson(configJson);
    mem.createVirtualTileSets();

    logger.info({ config }, 'Import:Start');
    for (const config of mem.objects.values()) this.update(config, commit);
    await Promise.all(this.promises);

    if (commit) {
      const configBundle: ConfigBundle = {
        id: Config.ConfigBundle.id(configJson.hash),
        name: Config.ConfigBundle.id(`config-${configJson.hash}.json`),
        path: config,
        hash: configJson.hash,
      };
      logger.info({ config }, 'Import:ConfigBundle');

      if (Config.ConfigBundle.isWriteable()) {
        // Insert a cb_hash record for reference
        await Config.ConfigBundle.put(configBundle);
        // Update the cb_latest record
        configBundle.id = Config.ConfigBundle.id('latest');
        await Config.ConfigBundle.put(configBundle);
      }
    }

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

    if (backup) {
      await fsa.writeJson(backup, this.backupConfig.toJson());
    }

    if (commit !== true) logger.info('DryRun:Done');
  }

  update(config: BaseConfig, commit: boolean): void {
    const promise = Q(async (): Promise<boolean> => {
      const updater = new Updater(config, commit);

      const hasChanges = await updater.reconcile();
      if (hasChanges) {
        this.invalidations.push(updater.invalidatePath());
        const oldData = await updater.getOldData();
        if (oldData != null) this.backupConfig.put(oldData); // No need to backup anything if there is new insert
      } else {
        this.backupConfig.put(config);
      }
      return true;
    });

    this.promises.push(promise);
  }
}
