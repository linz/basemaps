import { fsa, LogConfig } from '@basemaps/shared';
import { ConfigJson } from '@basemaps/config';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';

export const DefaultConfig = 'config/';
export const DefaultOutput = 'config/config.json';

export class CommandBundle extends CommandLineAction {
  private config: CommandLineStringParameter;
  private output: CommandLineStringParameter;
  private assets: CommandLineStringParameter;

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
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterLongName: '--output',
      description: 'Output of the bundle file',
    });
    this.assets = this.defineStringParameter({
      argumentName: 'ASSETS',
      parameterLongName: '--assets',
      description: 'Add assets location into the config bundle file',
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const config = this.config.value ?? DefaultConfig;
    const bundle = this.output.value ?? DefaultOutput;
    const mem = await ConfigJson.fromPath(config, logger);
    const configJson = mem.toJson();
    const assets = this.assets.value;
    if (assets) configJson.assets = assets;
    await fsa.writeJson(bundle, configJson);
    logger.info({ path: bundle }, 'ConfigBundled');
    return;
  }
}
