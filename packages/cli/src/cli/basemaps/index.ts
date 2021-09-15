#!/usr/bin/env node
import { LogConfig } from '@basemaps/shared';
import { PrettyTransform } from 'pretty-json-log';
import 'source-map-support/register';
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

        if (process.stdout.isTTY) {
            LogConfig.setOutputStream(PrettyTransform.stream());
        }
    }
}

new BasemapsCommandLine().run();
