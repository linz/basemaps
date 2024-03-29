import { ConfigJson } from '@basemaps/config-loader';
import { fsa, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import pLimit from 'p-limit';

export const DefaultConfig = 'config/';
export const DefaultOutput = 'config/config.json';

export class CommandBundle extends CommandLineAction {
  private config!: CommandLineStringParameter;
  private output!: CommandLineStringParameter;
  private assets!: CommandLineStringParameter;
  private configCache!: CommandLineStringParameter;

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
    this.configCache = this.defineStringParameter({
      argumentName: 'CACHE',
      parameterLongName: '--cache',
      description: 'Location of the config cache to reduce number of requests needed to source file',
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const configUrl = fsa.toUrl(this.config.value ?? DefaultConfig);
    const outputUrl = fsa.toUrl(this.output.value ?? DefaultOutput);
    const cacheLocation = this.configCache.value ? fsa.toUrl(this.configCache.value) : undefined;
    const q = pLimit(25);
    const mem = await ConfigJson.fromUrl(configUrl, q, logger, cacheLocation);
    if (this.assets.value) mem.assets = this.assets.value;
    const configJson = mem.toJson();
    await fsa.write(outputUrl, JSON.stringify(configJson));
    logger.info({ path: outputUrl }, 'ConfigBundled');
    return;
  }
}
