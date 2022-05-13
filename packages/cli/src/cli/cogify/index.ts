#!/usr/bin/env node
import 'source-map-support/register.js';
import { BaseCommandLine } from '../base.cli.js';
import { ActionCogCreate } from './action.cog.js';
import { ActionJobCreate } from './action.job.js';

export class CogifyCommandLine extends BaseCommandLine {
  constructor() {
    super({
      toolFilename: 'cogify',
      toolDescription: 'Cloud optimized geotiff utilities',
    });
    this.addAction(new ActionCogCreate());
    this.addAction(new ActionJobCreate());
  }
}

new CogifyCommandLine().run();
