#!/usr/bin/env node
import 'source-map-support/register';
import { CommandLineParser } from '@microsoft/ts-command-line';
import { LogConfig } from '@basemaps/shared';
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

new CogifyCommandLine().execute();
