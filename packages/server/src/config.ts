import { BasemapsConfigProvider, ConfigBundled, ConfigJson, ConfigProviderMemory } from '@basemaps/config';
import { initConfigFromUrls } from '@basemaps/config/build/json/tiff.config.js';
import { LogType, fsa } from '@basemaps/shared';

export type ServerOptions = ServerOptionsTiffs | ServerOptionsConfig;

/** Load configuration from folders */
export interface ServerOptionsTiffs {
  assets?: string;
  paths: URL[];
}

/** Load configuration from a config file */
export interface ServerOptionsConfig {
  assets?: string;
  config: string;
}

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
    const ret = await initConfigFromUrls(mem, opts.paths);
    logger.info({ tileSet: ret.tileSet.name, layers: ret.tileSet.layers.length }, 'TileSet:Loaded');
    for (const im of ret.imagery) {
      logger.info(
        { imagery: im.uri, title: im.title, tileMatrix: im.tileMatrix, files: im.files.length },
        'Imagery:Loaded',
      );
    }
    return mem;
  }
  const configPath = opts.config;

  // Read a bundled config directly from a JSON file.
  if (configPath.endsWith('.json') || configPath.endsWith('.json.gz')) {
    logger.info({ path: configPath, mode: 'config:bundle' }, 'Starting Server');
    const configJson = await fsa.readJson<ConfigBundled>(configPath);
    const mem = ConfigProviderMemory.fromJson(configJson);
    mem.createVirtualTileSets();
    return mem;
  }

  const mem = await ConfigJson.fromPath(configPath, logger);
  logger.info({ path: configPath, mode: 'config:json' }, 'Starting Server');
  mem.createVirtualTileSets();
  return mem;
}
