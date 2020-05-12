#!/usr/bin/env node
import 'source-map-support/register';
import { BaseCommandLine } from '../base.cli';
import { ActionBatchJob } from './action.batch';
import { ActionCogCreate } from './action.cog';
import { ActionJobCreate } from './action.job';

export class CogifyCommandLine extends BaseCommandLine {
    constructor() {
        super({
            toolFilename: 'cogify',
            toolDescription: 'Cloud optimized geotiff utilities',
        });
        this.addAction(new ActionCogCreate());
        this.addAction(new ActionJobCreate());
        this.addAction(new ActionBatchJob());
    }
}

new CogifyCommandLine().run();
