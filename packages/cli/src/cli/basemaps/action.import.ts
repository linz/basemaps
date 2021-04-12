import { TileSetNameParser } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import { Config, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { CogStacJob } from '../../cog/cog.stac.job';
import { createImageryRecordFromJob } from '../cogify/action.batch';
import { TagActions } from '../tag.action';
// import { updateConfig } from './tileset.updater'; // FIXME

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
            summary: 'Import imagery and tileset rules from a config file"',
            documentation: '',
        });
    }

    protected onDefineParameters(): void {
        this.config = this.defineStringParameter({
            argumentName: 'JSON_FILE',
            parameterLongName: '--config',
            parameterShortName: '-c',
            description: 'Configure tilesets using json file. May not be used with --job option)',
            required: false,
        });

        this.job = this.defineStringParameter({
            argumentName: 'JOB',
            parameterLongName: '--job',
            parameterShortName: '-j',
            description: 'Import imagery from a job.json',
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
            if (this.job.value) {
                throw new Error('--job and --config may not be used at same time!');
            }

            const tagInput = this.tag.value;
            if (!TileSetNameParser.isValidTag(tagInput)) {
                LogConfig.get().fatal({ tag: tagInput }, 'Invalid tag name');
                console.log(this.renderHelpText());
                return;
            }

            // FIXME
            // await updateConfig(this.config.value, tagInput, !!this.commit.value);
            return;
        }

        const logger = LogConfig.get();

        const jobPath = this.job.value!;
        if (!jobPath.startsWith('s3://')) throw new Error('Invalid job path, must start with s3://');

        logger.warn({ jobPath }, 'FetchingJob');

        const job = await CogStacJob.load(jobPath);

        const imgId = Config.prefix(Config.Prefix.Imagery, job.id);
        const imagery = await Config.Imagery.get(imgId);
        if (imagery != null && !this.force.value) {
            logger.warn({ imgId }, 'Imagery already exists, aborting');
            return;
        }

        logger.info({ imagery: job.name }, 'Importing');

        const imgRecord = createImageryRecordFromJob(job);

        if (imgRecord.year === -1) logger.warn({ imagery: job.name }, 'Failed to parse year');
        if (imgRecord.resolution === -1) logger.warn({ imagery: job.name }, 'Failed to parse resolution');
        if (Epsg.tryGet(imgRecord.projection) == null) {
            logger.error({ imagery: job.name, projection: imgRecord.projection }, 'Failed to parse projection');
            return;
        }

        logger.info({ record: imgRecord }, 'Create');
        if (this.commit.value) {
            logger.info({ imagery: job.name, imgId }, 'CreatingRecord');
            await Config.Imagery.put(imgRecord);
        } else {
            logger.warn('DryRun:Done');
        }
    }
}
