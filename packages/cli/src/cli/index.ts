#!/usr/bin/env node
import { BaseCommandLine } from '@basemaps/shared/build/cli/base.js';
import 'source-map-support/register.js';
import { CommandCogCreate } from './cogify/action.cog.js';
import { CommandCreateOverview } from './overview/action.create.overview.js';
import { CommandCogPullRequest } from './cogify/action.make.cog.pr.js';
import { CommandJobCreate } from './cogify/action.job.js';
import { CommandMakeCog } from './cogify/action.make.cog.js';
import { CommandBundleAssets } from './config/action.bundle.assets.js';
import { CommandBundle } from './config/action.bundle.js';
import { CommandCogMapSheet } from './config/action.cog.mapsheet.js';
import { CommandImageryConfig } from './config/action.imagery.config.js';
import { CommandImport } from './config/action.import.js';
import { CommandSprites } from './sprites/action.sprites.js';

export class BasemapsConfigCommandLine extends BaseCommandLine {
  constructor() {
    super({
      toolFilename: 'bmc',
      toolDescription: 'Basemaps config command tools',
    });

    this.addAction(new CommandCogCreate());
    this.addAction(new CommandJobCreate());
    this.addAction(new CommandMakeCog());
    this.addAction(new CommandCreateOverview());
    this.addAction(new CommandCogPullRequest());

    this.addAction(new CommandBundle());
    this.addAction(new CommandBundleAssets());
    this.addAction(new CommandImport());
    this.addAction(new CommandImageryConfig());

    this.addAction(new CommandSprites());

    this.addAction(new CommandCogMapSheet());
  }
}
