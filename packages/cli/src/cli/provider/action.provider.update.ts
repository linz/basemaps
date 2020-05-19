/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Aws, LogConfig, TileMetadataTag, TileMetadataProviderRecord } from '@basemaps/lambda-shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { readFileSync } from 'fs';
import { printProvider, BlankProvider, validateProvider } from './provider.util';
import * as c from 'ansi-colors';

export class ProviderUpdateAction extends CommandLineAction {
    commit: CommandLineFlagParameter;

    sourcePath: CommandLineStringParameter;

    public constructor() {
        super({
            actionName: 'update',
            summary: 'Update information for the provider',
            documentation: 'Configure the data about the provider',
        });
    }

    protected onDefineParameters(): void {
        this.sourcePath = this.defineStringParameter({
            argumentName: 'SOURCE_PATH',
            parameterLongName: '--source',
            description: 'path to json file detailing the provider',
            required: true,
        });

        this.commit = this.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Commit to database',
            required: false,
        });
    }

    protected async onExecute(): Promise<void> {
        const before = (await Aws.tileMetadata.Provider.get(TileMetadataTag.Head)) || BlankProvider;

        console.log(c.red('\nBefore'));
        printProvider(before);

        const after = JSON.parse(readFileSync(this.sourcePath.value!).toString()) as TileMetadataProviderRecord;

        const changes = validateProvider(after, before);
        if (changes != null) {
            after.createdAt = before.createdAt;
            if (after.createdAt == 0) after.createdAt = Date.now();
            console.log(c.green('\nChanges'));
            printProvider(after, changes);
            if (this.commit.value) {
                await Aws.tileMetadata.Provider.create(after);
            } else {
                LogConfig.get().warn('DryRun:Done');
            }
        } else {
            LogConfig.get().info('No Changes');
        }
    }
}
