import { ConfigJson, ConfigProvider, ConfigProviderDynamo, ConfigProviderMemory } from '@basemaps/config';
import { TileSetLocal } from '@basemaps/lambda-tiler/build/cli/tile.set.local.js';
import { TileSets } from '@basemaps/lambda-tiler/build/tile.set.cache.js';
import { Config, Env, fsa, LogConfig } from '@basemaps/shared';
import { Command, flags } from '@oclif/command';
import { basename, dirname } from 'path';
import { createServer } from './server.js';

const logger = LogConfig.get();

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

export class BasemapsServerCommand extends Command {
  static description = 'Create a WMTS/XYZ Tile server for basemaps config';
  static flags = {
    verbose: flags.boolean(),
    port: flags.integer({ default: 5000 }),
    dynamo: flags.string({ description: 'Dynamodb table', required: false }),
    config: flags.string({ description: 'Configuration path', required: false }),
    files: flags.string({ description: 'Use folders of tiffs as the configuration', required: false }),
  };

  static args = [];

  async loadTiffs(tiffPath: string, serverUrl: string): Promise<void> {
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

  async run(): Promise<void> {
    const { flags } = this.parse(BasemapsServerCommand);
    if (flags.verbose) logger.level = 'debug';

    const ServerUrl = `http://localhost:${flags.port}`;

    if (flags.config != null) {
      // Load configuration from a collection of JSON files
      logger.info({ path: flags.config, mode: 'config' }, 'Starting Server');

      if (flags.config.endsWith('.json')) {
        const configJson = await fsa.read(flags.config);
        const mem = ConfigProviderMemory.fromJson(JSON.parse(configJson.toString()));
        Config.setConfigProvider(mem);
      } else {
        const cj = await ConfigJson.fromPath(flags.config, logger);
        Config.setConfigProvider(cj.mem);
      }
    } else if (flags.dynamo != null) {
      // Load configuration from a dynamodb table
      logger.info({ dynamo: flags.dynamo, mode: 'dynamo' }, 'Starting Server');
      Config.setConfigProvider(new ConfigProviderDynamo(flags.dynamo));
    } else if (flags.files != null) {
      // Generate configuration form a collection of tiff files
      logger.info({ path: flags.files, mode: 'files' }, 'Starting Server');
      await this.loadTiffs(flags.files, ServerUrl);
    } else {
      throw new Error('Either a --config, --tiff or --dynamodb must be supplied');
    }
    // Force a default url base so WMTS requests know their relative url
    process.env[Env.PublicUrlBase] = process.env[Env.PublicUrlBase] ?? `http://localhost:${flags.port}`;

    createServer(logger).listen(flags.port, () => {
      logger.info({ url: ServerUrl }, 'ServerStarted');
    });
  }
}
