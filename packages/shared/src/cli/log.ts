import { flag } from 'cmd-ts';

import { LogConfig, LogType } from '../log.js';
import { isArgo } from './argo.js';
import { CliInfo } from './info.js';

export const logArguments = {
  verbose: flag({ long: 'verbose', description: 'Enable verbose logging' }),
  extraVerbose: flag({ long: 'extra-verbose', description: 'Extra verbose logging' }),
};

export function getLogger(
  cli: { name: string },
  args: { verbose: boolean; extraVerbose: boolean },
  packageName?: string,
): LogType {
  const logger = LogConfig.get();
  if (packageName) CliInfo.package = packageName.startsWith('@') ? packageName : '@' + packageName;
  if (args.verbose) logger.level = 'debug';
  if (args.extraVerbose) logger.level = 'trace';
  logger.info({ package: CliInfo, cli: cli.name, args, isArgo: isArgo() }, 'Cli:Start');
  return logger;
}
