#!/usr/bin/env node
import { BaseCommandLine } from '@basemaps/shared/build/cli/base.js';
import 'source-map-support/register.js';
import { CommandScreenShot } from './screenshot.js';

export class ScreenshotCommandLine extends BaseCommandLine {
  constructor() {
    super({
      toolFilename: 'screenshot',
      toolDescription: 'Dump screenshots from Basemaps',
    });
    this.addAction(new CommandScreenShot());
  }
}

new ScreenshotCommandLine().run();
