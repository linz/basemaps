import { LogConfig, LogType } from '@basemaps/shared';
import { CommandLineAction, CommandLineStringParameter, CommandLineIntegerParameter } from '@rushstack/ts-command-line';

export abstract class TileSetBaseAction extends CommandLineAction {
    tileSet: CommandLineStringParameter;
    projection: CommandLineIntegerParameter;

    protected onDefineParameters(): void {
        this.tileSet = this.defineStringParameter({
            argumentName: 'TILE_SET',
            parameterLongName: '--tileset-name',
            parameterShortName: '-n',
            description: 'Tileset name to use',
            required: false,
        });

        this.projection = this.defineIntegerParameter({
            argumentName: 'PROJECTION',
            parameterLongName: '--projection',
            parameterShortName: '-p',
            description: 'Projection to use',
            required: false,
        });
    }

    /** Log a fatal error and render the help text */
    fatal(obj: Record<string, unknown>, msg: string, logger: LogType = LogConfig.get()): void {
        logger.fatal(obj, msg);
        console.log('\n');
        console.log(this.renderHelpText());
    }
}
