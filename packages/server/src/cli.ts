import { ConfigJson, ConfigProvider, ConfigProviderDynamo, ConfigProviderMemory } from '@basemaps/config';
import { TileSetLocal } from '@basemaps/lambda-tiler/build/cli/tile.set.local.js';
import { TileSets } from '@basemaps/lambda-tiler/build/tile.set.cache.js';
import { Config, Const, Env, fsa, LogConfig, LogType } from '@basemaps/shared';
import { BaseCommandLine, CliInfo } from '@basemaps/shared/build/cli/base.js';
import { basename, dirname } from 'path';
import { createServer } from './server.js';

CliInfo.package = 'basemaps/server';

const BaseProvider: ConfigProvider = {
  id: 'pv_linz',
  version: 1,
  serviceIdentification: {},
  serviceProvider: {
    name: 'basemaps/server',
    contact: {
      address: {},
    },
  },
} as any;

const DefaultPort = 5000;

export class BasemapsServerCommand extends BaseCommandLine {
  config = this.defineStringParameter({
    argumentName: 'CONFIG',
    parameterLongName: '--config',
    description: 'Configuration source to use',
  });
  ignoreConfig = this.defineFlagParameter({
    parameterLongName: '--no-config',
    description: 'Assume no config and just load tiffs from the configuration path',
  });
  port = this.defineIntegerParameter({
    argumentName: 'PORT',
    parameterLongName: '--port',
    description: 'port to use',
    defaultValue: DefaultPort,
  });

  constructor() {
    super({
      toolFilename: 'bms',
      toolDescription: 'Create a WMTS/XYZ Tile server from basemaps config',
    });
  }

  static args = [];

  async loadTiffs(tiffPath: string, serverUrl: string, logger: LogType): Promise<void> {
    const config = new ConfigProviderMemory();
    Config.setConfigProvider(config);

    const tifSets = new Map<string, TileSetLocal>();

    for await (const file of fsa.details(tiffPath)) {
      const lowerPath = file.path.toLowerCase();
      if (lowerPath.endsWith('.tiff') || lowerPath.endsWith('.tif')) {
        const tiffPath = dirname(file.path);
        if (tifSets.has(tiffPath)) continue;

        const tileSet = basename(tiffPath);
        const tsl = new TileSetLocal(tileSet, tiffPath);
        tifSets.set(tiffPath, tsl);

        await tsl.load();
        TileSets.add(tsl, new Date('3000-01-01').getTime());

        const wmtsUrl = `${serverUrl}/v1/tiles/${tileSet}/WMTSCapabilities.xml`;
        logger.info({ tileSetId: tileSet, wmtsUrl }, 'TileSet:Loaded');
        if (!config.objects.has('pv_linz')) config.put(BaseProvider);
      }
    }
  }

  async onExecute(): Promise<void> {
    await super.onExecute();

    const logger = LogConfig.get();
    logger.level = 'debug';
    const config = this.config.value ?? 'dynamodb://' + Const.TileMetadata.TableName;
    const port = this.port.value;

    const ServerUrl = Env.get(Env.PublicUrlBase) ?? `http://localhost:${port}`;
    // Force a default url base so WMTS requests know their relative url
    process.env[Env.PublicUrlBase] = ServerUrl;

    if (config.startsWith('dynamodb://')) {
      // Load config from dynamodb table
      const table = config.slice('dynamodb://'.length);
      logger.info({ path: config, table, mode: 'dynamo' }, 'Starting Server');
      Config.setConfigProvider(new ConfigProviderDynamo(table));
    } else if (config.endsWith('.json')) {
      // Bundled config
      logger.info({ path: config, mode: 'config' }, 'Starting Server');
      const configJson = await fsa.read(config);
      const mem = ConfigProviderMemory.fromJson(JSON.parse(configJson.toString()));
      Config.setConfigProvider(mem);
    } else if (this.ignoreConfig.value) {
      // Load config directly from tiff files
      logger.info({ path: config, mode: 'tiffs' }, 'Starting Server');
      await this.loadTiffs(config, ServerUrl, logger);
    } else {
      // Assume the folder is a collection of config files
      logger.info({ path: config, mode: 'config' }, 'Starting Server');
      const mem = await ConfigJson.fromPath(config, logger);
      mem.createVirtualTileSets();
      Config.setConfigProvider(mem);
    }

    createServer(logger).listen(port ?? DefaultPort, '0.0.0.0', () => {
      logger.info({ url: ServerUrl }, 'ServerStarted');
    });
  }
}

new BasemapsServerCommand().executeWithoutErrorHandling().catch((c) => {
  console.log(c);
});
