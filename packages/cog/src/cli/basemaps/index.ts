#!/usr/bin/env node
import 'source-map-support/register';
import { BaseCommandLine } from '../base.cli';
import { TileSetUpdateAction } from './action.tileset.update';
import { TileSetInfoAction } from './action.tileset.info';

export class BasemapsCommandLine extends BaseCommandLine {
    constructor() {
        super({
            toolFilename: 'basemaps',
            toolDescription: 'Basemaps configuration utilities',
        });
        this.addAction(new TileSetInfoAction());
        this.addAction(new TileSetUpdateAction());
    }
}

new BasemapsCommandLine().run();
