#!/usr/bin/env node
import { BaseCommandLine } from '@basemaps/shared/build/cli/base.js';
import 'source-map-support/register.js';
import { CommandCreateOverview } from './overview/action.create.overview.js';
import { CommandBundleAssets } from './config/action.bundle.assets.js';
import { CommandBundle } from './config/action.bundle.js';
import { CommandCogMapSheet } from './config/action.cog.mapsheet.js';
import { CommandImageryConfig } from './config/action.imagery.config.js';
import { CommandImport } from './config/action.import.js';

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
    this.addAction(new CommandCogMapSheet());
    this.addAction(new CommandCreateOverview());
  }
}
