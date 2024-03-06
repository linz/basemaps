import { pathToFileURL } from 'node:url';

import { Env, LogConfig } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, flag, number, option, optional, restPositionals, string, Type } from 'cmd-ts';

import { createServer } from './server.js';

CliInfo.package = 'basemaps/server';

const DefaultPort = 5000;
/**
 * Parse a input parameter as a URL,
 * if it looks like a file path convert it using `pathToFileURL`
 **/
export const Url: Type<string, URL> = {
  async from(str) {
    try {
      return new URL(str);
    } catch (e) {
      return pathToFileURL(str);
    }
  },
};

export const BasemapsServerCommand = command({
  name: 'basemaps-server',
  version: CliInfo.version,
  description: 'Create a basemaps server',
  args: {
    config: option({ type: optional(string), long: 'config', description: 'Configuration to use' }),
    port: option({
      type: optional(number),
      long: 'port',
      description: 'Port to use',
      defaultValue: () => DefaultPort,
      env: 'PORT',
    }),
    verbose: flag({ long: 'verbose', description: 'Enable verbose logging' }),
    assets: option({
      type: optional(string),
      long: 'assets',
      description: 'Where the assets (sprites, fonts) are located',
    }),
    cache: option({
      type: optional(Url),
      long: 'cache',
      description: 'Cache the metadata from loading of tiff files',
    }),
    paths: restPositionals({ type: Url, displayName: 'path', description: 'Path to imagery' }),
  },
  handler: async (args) => {
    const logger = LogConfig.get();
    if (args.verbose) logger.level = 'debug';
    if (args.paths.length === 0 && args.config == null) {
      throw new Error('Either --config or paths must be used. see --help');
    }
    logger.info({ package: CliInfo, cli: 'server' }, 'Cli:Start');

    const ServerUrl = Env.get(Env.PublicUrlBase) ?? `http://localhost:${args.port}`;
    // Force a default url base so WMTS requests know their relative url
    process.env[Env.PublicUrlBase] = ServerUrl;
    const serverOptions = args.config
      ? { assets: args.assets, config: args.config, configCache: args.cache }
      : { assets: args.assets, paths: args.paths, configCache: args.cache };

    const server = await createServer(serverOptions, logger);

    await server.listen({ port: args.port, host: '0.0.0.0' });
    logger.info({ url: ServerUrl + '/layers' }, 'ServerStarted');
  },
});
