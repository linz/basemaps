#!/usr/bin/env node
import { BaseCommandLine } from '@basemaps/shared/build/cli/base.js';
import 'source-map-support/register.js';
import { CommandScreenShot } from './screenshot.js';

export class BasemapsConfig extends BaseCommandLine {
  constructor() {
    super({
      toolFilename: 'bin',
      toolDescription: 'Basemaps config command tools',
    });
    this.addAction(new CommandScreenShot());
  }
}

new BasemapsConfig().run();
