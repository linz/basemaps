#!/usr/bin/env node
import { BaseCommandLine } from '@basemaps/shared/build/cli/base.js';
import 'source-map-support/register.js';
import { ActionCogCreate } from './cogify/action.cog.js';
import { ActionJobCreate } from './cogify/action.job.js';
import { CommandBundle } from './config/action.bundle.js';
import { CommandImport } from './config/action.import.js';
import { CommandScreenShot } from './screenshot/screenshot.js';

export class BasemapsConfigCommandLine extends BaseCommandLine {
  constructor() {
    super({
      toolFilename: 'bmc',
      toolDescription: 'Basemaps config command tools',
    });

    this.addAction(new ActionCogCreate());
    this.addAction(new ActionJobCreate());

    this.addAction(new CommandBundle());
    this.addAction(new CommandImport());

    this.addAction(new CommandScreenShot());
  }
}
