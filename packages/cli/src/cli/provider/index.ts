#!/usr/bin/env node
import { LogConfig } from '@basemaps/shared';
import { PrettyTransform } from 'pretty-json-log';
import 'source-map-support/register';
import { BaseCommandLine } from '../base.cli';
import { ProviderInfoAction } from './action.provider.info';
import { ProviderUpdateAction } from './action.provider.update';
import { ProviderHistoryAction } from './action.provider.history';
import { ProviderUpdateTagAction } from './action.provider.tag';

export class ProviderCommandLine extends BaseCommandLine {
    constructor() {
        super({
            toolFilename: 'provider',
            toolDescription: 'Provider configuration utilities',
        });
        this.addAction(new ProviderInfoAction());
        this.addAction(new ProviderUpdateAction());
        this.addAction(new ProviderUpdateTagAction());
        this.addAction(new ProviderHistoryAction());

        if (process.stdout.isTTY) {
            LogConfig.setOutputStream(PrettyTransform.stream());
        }
    }
}

new ProviderCommandLine().run();
