import { isArgo } from '@basemaps/cogify/build/argo.js';
import { LogConfig, LogType } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { flag } from 'cmd-ts';

export const logArguments = {
  verbose: flag({ long: 'verbose', description: 'Enable verbose logging' }),
  extraVerbose: flag({ long: 'extra-verbose', description: 'Extra verbose logging' }),
};

export function getLogger(cli: { name: string }, args: { verbose: boolean; extraVerbose: boolean }): LogType {
  const logger = LogConfig.get();
  CliInfo.package = '@' + 'basemaps/cli';
  if (args.verbose) logger.level = 'debug';
  if (args.extraVerbose) logger.level = 'trace';
  logger.info({ package: CliInfo, cli: cli.name, args, isArgo: isArgo() }, 'Cli:Start');
  return logger;
}
