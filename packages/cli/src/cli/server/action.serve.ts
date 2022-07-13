import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';

import { createServer } from '@basemaps/server';
import { Const, Env, LogConfig } from '@basemaps/shared';
const DefaultPort = 5000;

export class CommandServe extends CommandLineAction {
  config: CommandLineStringParameter;
  assets: CommandLineStringParameter;
  port: CommandLineIntegerParameter;

  public constructor() {
    super({
      actionName: 'serve',
      summary: 'Cli tool to create sprite sheet',
      documentation: 'Create a sprite sheet from a folder of sprites',
    });
  }

  protected onDefineParameters(): void {
    this.config = this.defineStringParameter({
      argumentName: 'CONFIG',
      parameterLongName: '--config',
      description: 'Configuration source to use',
    });
    this.assets = this.defineStringParameter({
      argumentName: 'ASSETS',
      parameterLongName: '--assets',
      description: 'Where the assets (sprites, fonts) are located',
    });
    this.port = this.defineIntegerParameter({
      argumentName: 'PORT',
      parameterLongName: '--port',
      description: 'port to use',
      defaultValue: DefaultPort,
    });
  }

  protected async onExecute(): Promise<void> {
    const logger = LogConfig.get();

    const config = this.config.value ?? 'dynamodb://' + Const.TileMetadata.TableName;
    const port = this.port.value;
    const assets = this.assets.value;

    // Force a default url base so WMTS requests know their relative url
    const ServerUrl = Env.get(Env.PublicUrlBase) ?? `http://localhost:${port}`;
    process.env[Env.PublicUrlBase] = ServerUrl;

    const server = await createServer({ config, assets }, logger);
    server.listen(port ?? DefaultPort, '0.0.0.0', () => {
      logger.info({ url: ServerUrl }, 'ServerStarted');
    });
  }
}
