#!/usr/bin/env node
import { LogConfig } from '@basemaps/shared';
import { CommandLineParser } from '@microsoft/ts-command-line';
import { PrettyTransform } from 'pretty-json-log';
import 'source-map-support/register';
import { ActionCogCreate } from './actions/action.cog';
import { ActionCogJobCreate } from './actions/action.job';

export class CogifyCommandLine extends CommandLineParser {
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

    constructor() {
        super({
            toolFilename: 'cogify',
            toolDescription: 'Cloud optimized geotiff utilities',
        });
        this.addAction(new ActionCogCreate());
        this.addAction(new ActionCogJobCreate());
    }

    protected onExecute(): Promise<void> {
        const logger = LogConfig.get();

        // If the console is a tty pretty print the output
        if (process.stdout.isTTY) {
            LogConfig.setOutputStream(PrettyTransform.stream());
        }

        if (this.verbose.value) {
            logger.level = 'info';
        } else if (this.extraVerbose.value) {
            logger.level = 'trace';
        } else {
            logger.level = 'warn';
        }

        return super.onExecute();
    }
    protected onDefineParameters(): void {
        // Nothing
    }
}

new CogifyCommandLine()
    .executeWithoutErrorHandling()
    .catch(err => LogConfig.get().fatal({ err }, 'Failed to run command'));
