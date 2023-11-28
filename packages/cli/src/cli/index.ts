#!/usr/bin/env node
import 'source-map-support/register.js';

import { BaseCommandLine } from '@basemaps/shared/build/cli/base.js';

import { CommandBundleAssets } from './config/action.bundle.assets.js';
import { CommandBundle } from './config/action.bundle.js';
import { CommandImageryConfig } from './config/action.imagery.config.js';
import { CommandImport } from './config/action.import.js';
import { CommandCreateOverview } from './overview/action.create.overview.js';
import { CommandServe } from './server/action.serve.js';

export class BasemapsConfigCommandLine extends BaseCommandLine {
  constructor() {
    super({
      toolFilename: 'bmc',
      toolDescription: 'Basemaps config command tools',
    });

    // Basemaps Config
    this.addAction(new CommandBundle());
    this.addAction(new CommandBundleAssets());
    this.addAction(new CommandImport());
    this.addAction(new CommandImageryConfig());

    // Argo
    this.addAction(new CommandCreateOverview());

    // CICD - Screenshot tests
    this.addAction(new CommandServe());
  }
}
