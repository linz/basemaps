/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Config } from '@basemaps/shared';
import { CommandLineAction, CommandLineIntegerParameter } from '@rushstack/ts-command-line';
import * as c from 'ansi-colors';
import { TagActions } from '../tag.action';
import { printProvider } from './provider.util';

export class ProviderInfoAction extends CommandLineAction {
    private version: CommandLineIntegerParameter;

    public constructor() {
        super({
            actionName: 'info',
            summary: 'Rendering information for tile sets or imagery',
            documentation: 'Get rendering information for the tile set or imagery',
        });
    }

    protected onDefineParameters(): void {
        this.version = this.defineIntegerParameter(TagActions.Version);
    }

    protected async onExecute(): Promise<void> {
        const providerId = Config.Provider.id({ name: 'main' }, this.version.value! ?? Config.Tag.Head);
        const tsData = await Config.Provider.get(providerId);
        if (tsData == null) {
            console.log(c.red('Provider info Not Found '));
        } else {
            printProvider(tsData);
        }
    }
}
