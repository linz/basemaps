#!/usr/bin/env node
import 'source-map-support/register.js';
import { BaseCommandLine } from '../base.cli.js';
import { TileSetInvalidateAction } from './action.invalidate.js';
import { TileSetInfoAction } from './action.tileset.info.js';

export class BasemapsCommandLine extends BaseCommandLine {
  constructor() {
    super({
      toolFilename: 'basemaps',
      toolDescription: 'Basemaps configuration utilities',
    });
    this.addAction(new TileSetInfoAction());
    this.addAction(new TileSetInvalidateAction());
  }
}

new BasemapsCommandLine().run();
