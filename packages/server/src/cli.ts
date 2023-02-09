import { Const, Env, LogConfig } from '@basemaps/shared';
import { BaseCommandLine, CliInfo } from '@basemaps/shared/build/cli/base.js';
import { createServer } from './server.js';

CliInfo.package = 'basemaps/server';

const DefaultPort = 5000;

export class BasemapsServerCommand extends BaseCommandLine {
  config = this.defineStringParameter({
    argumentName: 'CONFIG',
    parameterLongName: '--config',
    description: 'Configuration source to use',
  });
  assets = this.defineStringParameter({
    argumentName: 'ASSETS',
    parameterLongName: '--assets',
    description: 'Where the assets (sprites, fonts) are located',
  });
  port = this.defineIntegerParameter({
    argumentName: 'PORT',
    parameterLongName: '--port',
    description: 'port to use',
    defaultValue: DefaultPort,
  });

  noConfig = this.defineFlagParameter({
    parameterLongName: '--no-config',
    description: 'Generate a configuration directly from imagery',
  });

  constructor() {
    super({
      toolFilename: 'basemaps-server',
      toolDescription: 'Create a WMTS/XYZ Tile server from basemaps config',
    });
  }

  async onExecute(): Promise<void> {
    await super.onExecute();

    const logger = LogConfig.get();
    logger.level = 'debug';
    const config = this.config.value ?? 'dynamodb://' + Const.TileMetadata.TableName;
    const port = this.port.value;
    const assets = this.assets.value;

    const ServerUrl = Env.get(Env.PublicUrlBase) ?? `http://localhost:${port}`;
    // Force a default url base so WMTS requests know their relative url
    process.env[Env.PublicUrlBase] = ServerUrl;

    const server = await createServer({ config, assets, noConfig: this.noConfig.value }, logger);

    await server.listen({ port: port ?? DefaultPort, host: '0.0.0.0' });
    logger.info({ url: ServerUrl }, 'ServerStarted');
  }
}
