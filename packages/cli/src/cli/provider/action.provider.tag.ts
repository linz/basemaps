/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TileSetNameParser } from '@basemaps/config';
import { Config, LogConfig } from '@basemaps/shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import * as c from 'ansi-colors';
import { TagActions } from '../tag.action';
import { invalidateCache } from '../util';
import { printProvider, validateProvider } from './provider.util';

export class ProviderUpdateTagAction extends CommandLineAction {
    private version: CommandLineIntegerParameter;
    private tag: CommandLineStringParameter;
    private commit: CommandLineFlagParameter;

    public constructor() {
        super({
            actionName: 'tag',
            summary: 'Tag a version',
            documentation: '',
        });
    }

    protected onDefineParameters(): void {
        this.version = this.defineIntegerParameter(TagActions.Version);
        this.tag = this.defineStringParameter(TagActions.Tag);
        this.commit = this.defineFlagParameter(TagActions.Commit);
    }

    protected async onExecute(): Promise<void> {
        const version = this.version.value!;

        const tag = TileSetNameParser.parseTag(this.tag.value);
        if (tag == null) return;

        const before = await Config.Provider.get(Config.Provider.id({ name: 'main' }, tag));

        const current = await Config.Provider.get(Config.Provider.id({ name: 'main' }, version));
        if (current == null) throw new Error('Unable to find version: ' + version);

        LogConfig.get().info({ version, tag }, 'Tagging');

        if (this.commit.value) {
            await Config.Provider.tag(current, tag);
            if (tag === Config.Tag.Production) {
                // TODO only invalidate WMTSCapabilities.xml paths
                await invalidateCache(`/v1/tiles/*`, this.commit.value);
            }
        }

        if (before != null) {
            const after = await Config.Provider.get(Config.Provider.id({ name: 'main' }, version));
            const changes = validateProvider(after!, before);
            if (changes != null) {
                console.log(c.green('\nChanges'));
                printProvider(after!, changes);
            }
        }

        if (!this.commit.value) {
            LogConfig.get().warn('DryRun:Done');
        }
    }
}
