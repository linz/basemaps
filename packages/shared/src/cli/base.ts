import 'source-map-support/register.js';

import { CommandLineParser } from '@rushstack/ts-command-line';

import { LogConfig } from '../log.js';
import { LoggerFatalError } from '../logger.fatal.error.js';
import { CliId, CliInfo } from './info.js';

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

  toolName: string;
  toolDescription: string;

  constructor(opt: { toolFilename: string; toolDescription: string }) {
    super(opt);
    this.toolName = opt.toolFilename;
    this.toolDescription = opt.toolDescription;
  }

  protected override onExecute(): Promise<void> {
    if (this.verbose.value) {
      LogConfig.get().level = 'debug';
    } else if (this.extraVerbose.value) {
      LogConfig.get().level = 'trace';
    } else {
      LogConfig.get().level = 'info';
    }

    const logger = LogConfig.get().child({ id: CliId });
    logger.info({ package: CliInfo, cli: this.toolName }, 'Cli:Start');
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
        LogConfig.get().fatal({ err, cli: this.toolName }, 'Cli:Failed');
      }
      process.exit(1);
    });
  }
}
