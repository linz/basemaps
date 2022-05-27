import { LogConfig } from '../log.js';
import { LoggerFatalError } from '../logger.fatal.error.js';
import { GitTag } from './git.tag.js';
import { CommandLineParser } from '@rushstack/ts-command-line';
import 'source-map-support/register.js';
import * as ulid from 'ulid';

/** Useful traceability information  */
export const CliInfo: { package: string; version: string; hash: string } = {
  // Detect unlinked packages looks for this string since its a package name, slightly work around it
  package: '@' + 'basemaps/cli',
  version: process.env.GIT_VERSION ?? GitTag().version,
  hash: process.env.GIT_HASH ?? GitTag().hash,
};

/** Unique Id for this instance of the cli being run */
export const CliId = ulid.ulid();

export abstract class BaseCommandLine extends CommandLineParser {
  verbose = this.defineFlagParameter({
    parameterLongName: '--verbose',
    parameterShortName: '-v',
    description: 'Show extra logging detail',
  });
  extraVerbose = this.defineFlagParameter({
    parameterLongName: '--vv',
    parameterShortName: '-V',
    description: 'Show extra extra logging detail',
  });

  protected onExecute(): Promise<void> {
    if (this.verbose.value) {
      LogConfig.get().level = 'debug';
    } else if (this.extraVerbose.value) {
      LogConfig.get().level = 'trace';
    } else {
      LogConfig.get().level = 'info';
    }

    const logger = LogConfig.get().child({ id: CliId });
    logger.info(CliInfo, 'CliStart');
    LogConfig.set(logger);

    return super.onExecute();
  }
  protected onDefineParameters(): void {
    // Nothing
  }

  public run(): void {
    this.executeWithoutErrorHandling().catch((err) => {
      if (err instanceof LoggerFatalError) {
        LogConfig.get().fatal(err.obj, err.message);
      } else {
        LogConfig.get().fatal({ err }, 'Failed to run command');
      }
      process.exit(1);
    });
  }
}
