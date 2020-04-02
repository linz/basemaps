#!/usr/bin/env node
import { LogConfig } from '@basemaps/lambda-shared';
import { CommandLineParser } from '@rushstack/ts-command-line';
import { PrettyTransform } from 'pretty-json-log';
import 'source-map-support/register';
import { ActionBatchJob } from './actions/action.batch';
import { ActionCogCreate } from './actions/action.cog';
import { ActionJobCreate } from './actions/action.job';

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
        this.addAction(new ActionJobCreate());
        this.addAction(new ActionBatchJob());
    }

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

        return super.onExecute();
    }
    protected onDefineParameters(): void {
        // Nothing
    }
}

new CogifyCommandLine().executeWithoutErrorHandling().catch((err) => {
    LogConfig.get().fatal({ err }, 'Failed to run command');
    process.exit(1);
});
