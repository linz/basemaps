#!/usr/bin/env node
import { LogConfig } from '@basemaps/lambda-shared';
import { CommandLineParser } from '@rushstack/ts-command-line';
import * as gitRev from 'git-rev-sync';
import { PrettyTransform } from 'pretty-json-log';
import 'source-map-support/register';
import * as ulid from 'ulid';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json');

/** Useful traceability information  */
export const CliInfo: { package: string; version: string; hash: string } = {
    package: packageJson.name as string,
    version: packageJson.version as string,
    hash: packageJson.hash ?? `${gitRev.branch()}@${gitRev.short()}`,
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
        // If the console is a tty pretty print the output
        if (process.stdout.isTTY) {
            LogConfig.setOutputStream(PrettyTransform.stream());
        }

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
            LogConfig.get().fatal({ err }, 'Failed to run command');
            process.exit(1);
        });
    }
}
