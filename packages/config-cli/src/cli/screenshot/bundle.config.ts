import { fsa, LogConfig } from '@basemaps/shared';
import { ConfigJson } from '@basemaps/config';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';

export const DefaultConfig = 'config/';
export const DefaultBundle = 'config/config.json';

export class CommandBundle extends CommandLineAction {
  private config: CommandLineStringParameter;
  private bundle: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'bundle',
      summary: 'bundle a config json from config files',
      documentation: 'Given a path of config files and bundle them into one config json',
    });
  }

  protected onDefineParameters(): void {
    this.config = this.defineStringParameter({
      argumentName: 'CONFIG',
      parameterLongName: '--config',
      description: 'Path of config files',
    });
    this.bundle = this.defineStringParameter({
      argumentName: 'BUNDLE',
      parameterLongName: '--bundle',
      description: 'Output of the bundle file',
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const config = this.config.value ?? DefaultConfig;
    const bundle = this.bundle.value ?? DefaultBundle;
    const mem = await ConfigJson.fromPath(config, logger);
    await fsa.writeJson(bundle, mem.toJson());
    logger.info({ path: bundle }, 'ConfigBundled');
    return;
  }
}
