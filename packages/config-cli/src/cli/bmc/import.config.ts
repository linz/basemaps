import { Env, fsa, LogConfig } from '@basemaps/shared';
import { BaseConfig, ConfigBundled, ConfigProviderMemory } from '@basemaps/config';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { Q, Updater } from './config/config.update.js';
import { invalidateCache } from '@basemaps/cli/build/cli/util.js';

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

    logger.info({ config }, 'Import:Load');
    const configJson = await fsa.readJson<ConfigBundled>(config);
    const mem = ConfigProviderMemory.fromJson(configJson);
    mem.createVirtualTileSets();

    logger.info({ config }, 'Import:Start');
    for (const config of mem.objects.values()) this.update(config, commit);
    await Promise.all(this.promises);

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

  update(config: BaseConfig, commit: boolean): void {
    const promise = Q(async (): Promise<boolean> => {
      const updater = new Updater(config, commit);
      const hasChanges = await updater.reconcile();
      if (hasChanges) this.invalidations.push(updater.invalidatePath());
      return true;
    });
    this.promises.push(promise);
  }
}
