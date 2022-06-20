import { BaseCommandLine } from '@basemaps/shared/build/cli/base.js';
import 'source-map-support/register.js';
import { CommandBundle } from './bundle.config.js';
import { CommandImport } from './import.config.js';
import { CommandScreenShot } from './screenshot.js';

export class BasemapsConfig extends BaseCommandLine {
  constructor() {
    super({
      toolFilename: 'bmc',
      toolDescription: 'Basemaps config command tools',
    });
    this.addAction(new CommandScreenShot());
    this.addAction(new CommandBundle());
    this.addAction(new CommandImport());
  }
}
