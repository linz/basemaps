import { Env, LogConfig } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, flag, number, option, optional, restPositionals, string } from 'cmd-ts';
import { createServer } from './server.js';

CliInfo.package = 'basemaps/server';

const DefaultPort = 5000;

export const BasemapsServerCommand = command({
  name: 'basemaps-server',
  description: 'Create a basemaps server',
  args: {
    config: option({ type: optional(string), long: 'config', description: 'Configuration to use' }),
    port: option({ type: optional(number), long: 'port', description: 'Port to use', defaultValue: () => DefaultPort }),
    verbose: flag({ long: 'verbose', description: 'Enable verbose logging' }),
    assets: option({
      type: optional(string),
      long: 'assets',
      description: 'Where the assets (sprites, fonts) are located',
    }),
    paths: restPositionals({ type: string, displayName: 'path', description: 'Path to imagery' }),
  },

  handler: async (args) => {
    const logger = LogConfig.get();
    if (args.verbose) logger.level = 'debug';
    if (args.paths.length == 0 && args.config == null) {
      throw new Error('Either --config or paths must be used. see --help');
    }
    logger.info({ package: CliInfo, cli: 'server' }, 'Cli:Start');

    const ServerUrl = Env.get(Env.PublicUrlBase) ?? `http://localhost:${args.port}`;
    // Force a default url base so WMTS requests know their relative url
    process.env[Env.PublicUrlBase] = ServerUrl;

    const server = await createServer(args, logger);

    await server.listen({ port: args.port, host: '0.0.0.0' });
    logger.info({ url: ServerUrl }, 'ServerStarted');
  },
});
