import { LogConfig, LogType } from '@basemaps/shared';
import { CommandLineAction } from '@rushstack/ts-command-line';

export abstract class TileSetBaseAction extends CommandLineAction {
    /** Log a fatal error and render the help text */
    fatal(obj: Record<string, unknown>, msg: string, logger: LogType = LogConfig.get()): void {
        logger.fatal(obj, msg);
        console.log('\n');
        console.log(this.renderHelpText());
    }
}
