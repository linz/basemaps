/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Aws, LogConfig, TileMetadataNamedTag, parseMetadataTag } from '@basemaps/shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { invalidateCache } from '../util';
import { validateProvider, printProvider } from './provider.util';
import * as c from 'ansi-colors';
import { TagAction } from '../tag.action';

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
        TagAction.onDefineParameters(this);
    }

    protected async onExecute(): Promise<void> {
        const version = this.version.value!;

        const tag = parseMetadataTag(this.tag.value);
        if (tag == null) return;

        const before = await Aws.tileMetadata.Provider.get(tag);

        LogConfig.get().info({ version, tag }, 'Tagging');

        if (this.commit.value) {
            await Aws.tileMetadata.Provider.tag(tag, version);
            if (tag === TileMetadataNamedTag.Production) {
                // TODO only invalidate WMTSCapabilities.xml paths
                await invalidateCache(`/v1/tiles/*`, this.commit.value);
            }
        }

        if (before !== null) {
            const after = await Aws.tileMetadata.Provider.get(version)!;
            const changes = validateProvider(after, before);
            if (changes !== null) {
                console.log(c.green('\nChanges'));
                printProvider(after, changes);
            }
        }

        if (!this.commit.value) {
            LogConfig.get().warn('DryRun:Done');
        }
    }
}
