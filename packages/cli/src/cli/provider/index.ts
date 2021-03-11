#!/usr/bin/env node
import { LogConfig } from '@basemaps/shared';
import { PrettyTransform } from 'pretty-json-log';
import 'source-map-support/register';
import { BaseCommandLine } from '../base.cli';
import { ProviderHistoryAction } from './action.provider.history';
import { ProviderInfoAction } from './action.provider.info';
import { ProviderUpdateTagAction } from './action.provider.tag';
import { ProviderUpdateAction } from './action.provider.update';

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
