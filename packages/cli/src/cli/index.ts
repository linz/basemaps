#!/usr/bin/env node
import { BaseCommandLine } from '@basemaps/shared/build/cli/base.js';
import 'source-map-support/register.js';
import { CommandList } from './aws/action.aws.list.js';
import { CommandCogCreate } from './cogify/action.cog.js';
import { CommandJobCreate } from './cogify/action.job.js';
import { CommandBundleAssets } from './config/action.bundle.assets.js';
import { CommandBundle } from './config/action.bundle.js';
import { CommandImport } from './config/action.import.js';
import { CommandScreenShot } from './screenshot/action.screenshot.js';
import { CommandServe } from './server/action.serve.js';
import { CommandSprites } from './sprites/action.sprites.js';

export class BasemapsConfigCommandLine extends BaseCommandLine {
  constructor() {
    super({
      toolFilename: 'bmc',
      toolDescription: 'Basemaps config command tools',
    });

    this.addAction(new CommandCogCreate());
    this.addAction(new CommandJobCreate());

    this.addAction(new CommandBundle());
    this.addAction(new CommandBundleAssets());
    this.addAction(new CommandImport());

    this.addAction(new CommandScreenShot());

    this.addAction(new CommandSprites());
    this.addAction(new CommandServe());

    this.addAction(new CommandList());
  }
}
