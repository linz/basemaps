import { ConfigTag, TileSetNameParser } from '@basemaps/config';
import { LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { TagActions } from '../tag.action';
import { promises as fs } from 'fs';
import { TileSetUpdater } from './tileset.updater';

/**
 * Import a config file for a specific name and projection
 */
export class ImportAction extends CommandLineAction {
    private config: CommandLineStringParameter;
    private tag: CommandLineStringParameter;
    private job: CommandLineStringParameter;
    private commit: CommandLineFlagParameter;
    private force: CommandLineFlagParameter;

    public constructor() {
        super({
            actionName: 'import',
            summary: 'Import basemaps tilesets and styles from a config file"',
            documentation: '',
        });
    }

    protected onDefineParameters(): void {
        this.config = this.defineStringParameter({
            argumentName: 'JSON_FILE',
            parameterLongName: '--config',
            parameterShortName: '-c',
            description: 'Configure tilesets and styles using json file. May not be used with --job option)',
            required: false,
        });

        this.force = this.defineFlagParameter({
            parameterLongName: '--force',
            description: 'Force overwrite. Only for use with --job',
            required: false,
        });

        this.tag = this.defineStringParameter(TagActions.Tag);
        this.commit = this.defineFlagParameter(TagActions.Commit);
    }

    protected async onExecute(): Promise<void> {
        if (this.config.value) {
            const tagInput = this.tag.value;
            if (!TileSetNameParser.isValidTag(tagInput)) {
                LogConfig.get().fatal({ tag: tagInput }, 'Invalid tag name');
                console.log(this.renderHelpText());
                return;
            }

            await updateConfig(this.config.value, tagInput, !!this.commit.value);
            return;
        }
    }
}

/**
 * Update the Head and Production config (and tags) to match the config file, Invalidate cloudfront
 *
 * @param filename the config file to apply
 * @param tag the tag to assign to the changes
 * @param isCommit commit changes or just dry run
 */
export async function updateConfig(filename: string, tag: ConfigTag, isCommit = false): Promise<void> {
    const [, type] = filename.split('/');
    if (type === 'tileset') {
        const configUpdater = new TileSetUpdater((await fs.readFile(filename)).toString(), tag);
    } else if (type === 'provider') {
    } else if (type === 'style') {
    } else {
        throw new Error(`Incorrect path ${filename}`);
    }
}
