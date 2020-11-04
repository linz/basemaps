/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Aws, TileMetadataNamedTag } from '@basemaps/shared';
import { CommandLineAction, CommandLineIntegerParameter } from '@rushstack/ts-command-line';
import * as c from 'ansi-colors';
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
        this.version = this.defineIntegerParameter({
            argumentName: 'VERSION',
            parameterLongName: '--version',
            parameterShortName: '-v',
            description: 'Version ID',
            required: false,
        });
    }

    protected async onExecute(): Promise<void> {
        const tsData = await Aws.tileMetadata.Provider.get(this.version.value! ?? TileMetadataNamedTag.Head);
        if (tsData == null) {
            console.log(c.red('Provider info Not Found '));
        } else {
            printProvider(tsData);
        }
    }
}
