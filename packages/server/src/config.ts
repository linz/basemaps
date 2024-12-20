import { BasemapsConfigProvider, ConfigBundled, ConfigPrefix, ConfigProviderMemory } from '@basemaps/config';
import { ConfigJson, initConfigFromUrls } from '@basemaps/config-loader';
import { ConfigProviderDynamo, fsa, getDefaultConfig, LogType } from '@basemaps/shared';
import pLimit from 'p-limit';
export type ServerOptions = (ServerOptionsTiffs | ServerOptionsConfig) & { configCache?: URL };

/** Load configuration from folders */
export interface ServerOptionsTiffs {
  assets?: string;
  paths: URL[];
}

/** Load configuration from a config file/dynamodb */
export interface ServerOptionsConfig {
  assets?: string;
  config: string;
}

const TiffLoadConcurrency = 25;

/**
 * Attempt to load a configuration file from a number of sources
 *
 * @param configPath Location to where the configuration is stored
 * @param noConfig Whether to generate a config directly from the source imagery
 *
 */
export async function loadConfig(opts: ServerOptions, logger: LogType): Promise<BasemapsConfigProvider> {
  // Load the config directly from the source tiff files
  if ('paths' in opts) {
    const mem = new ConfigProviderMemory();
    const ret = await initConfigFromUrls(mem, opts.paths, undefined, TiffLoadConcurrency, opts.configCache, logger);
    for (const ts of ret.tileSets) {
      logger.info(
        { tileSet: ts.name, layers: ts.layers.length, outputs: ts.outputs?.map((f) => f.name) },
        'TileSet:Loaded',
      );
    }

    for (const im of ret.imagery) {
      logger.info(
        { imagery: im.uri, title: im.title, tileMatrix: im.tileMatrix, files: im.files.length },
        'Imagery:Loaded',
      );
    }
    mem.createVirtualTileSets();
    return mem;
  }

  const configPath = opts.config;
  // Load config from dynamodb table
  if (configPath.startsWith('dynamodb://')) {
    const table = configPath.slice('dynamodb://'.length);
    logger.info({ path: configPath, table, mode: 'dynamo' }, 'Starting Server');
    return new ConfigProviderDynamo(table);
  }

  // Load a bundled config by loading it from the default dynamo reference
  if (configPath.startsWith(ConfigPrefix.ConfigBundle)) {
    const cb = await getDefaultConfig().ConfigBundle.get(configPath);
    if (cb == null) throw new Error(`Config bundle does not exist ${configPath}`);
    const configJson = await fsa.readJson<ConfigBundled>(fsa.toUrl(cb.path));
    const mem = ConfigProviderMemory.fromJson(configJson);
    mem.createVirtualTileSets();
    return mem;
  }

  // Read a bundled config directly from a JSON file.
  if (configPath.endsWith('.json') || configPath.endsWith('.json.gz')) {
    logger.info({ path: configPath, mode: 'config:bundle' }, 'Starting Server');
    const configJson = await fsa.readJson<ConfigBundled>(fsa.toUrl(configPath));
    const mem = ConfigProviderMemory.fromJson(configJson);
    mem.createVirtualTileSets();
    return mem;
  }

  const mem = await ConfigJson.fromUrl(fsa.toUrl(configPath), pLimit(TiffLoadConcurrency), logger, opts.configCache);
  logger.info({ path: configPath, mode: 'config:json' }, 'Starting Server');
  mem.createVirtualTileSets();
  return mem;
}
