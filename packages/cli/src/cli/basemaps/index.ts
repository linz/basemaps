#!/usr/bin/env node
import { LogConfig } from '@basemaps/shared';
import { PrettyTransform } from 'pretty-json-log';
import 'source-map-support/register';
import { BaseCommandLine } from '../base.cli';
import { ImportAction } from './action.import';
import { TileSetInvalidateTagAction } from './action.invalidate';
import { TileSetHistoryAction } from './action.tileset.history';
import { TileSetInfoAction } from './action.tileset.info';

export class BasemapsCommandLine extends BaseCommandLine {
    constructor() {
        super({
            toolFilename: 'basemaps',
            toolDescription: 'Basemaps configuration utilities',
        });
        this.addAction(new TileSetInfoAction());
        this.addAction(new TileSetHistoryAction());
        this.addAction(new TileSetInvalidateTagAction());
        this.addAction(new ImportAction());

        if (process.stdout.isTTY) {
            LogConfig.setOutputStream(PrettyTransform.stream());
        }
    }
}

new BasemapsCommandLine().run();
