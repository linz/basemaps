#!/usr/bin/env node
import 'source-map-support/register';
import { BaseCommandLine } from '../base.cli';
import { TileSetUpdateAction } from './action.tileset.update';
import { TileSetInfoAction } from './action.tileset.info';
import { ImportAction } from './action.import';
import { ExportAction } from './action.export';
import { TileSetUpdateTagAction } from './action.tileset.tag';
import { TileSetHistoryAction } from './action.tileset.history';
import { PrettyTransform } from 'pretty-json-log';
import { LogConfig } from '@basemaps/shared';

export class BasemapsCommandLine extends BaseCommandLine {
    constructor() {
        super({
            toolFilename: 'basemaps',
            toolDescription: 'Basemaps configuration utilities',
        });
        this.addAction(new TileSetInfoAction());
        this.addAction(new TileSetUpdateAction());
        this.addAction(new ImportAction());
        this.addAction(new ExportAction());
        this.addAction(new TileSetUpdateTagAction());
        this.addAction(new TileSetHistoryAction());

        if (process.stdout.isTTY) {
            LogConfig.setOutputStream(PrettyTransform.stream());
        }
    }
}

new BasemapsCommandLine().run();
