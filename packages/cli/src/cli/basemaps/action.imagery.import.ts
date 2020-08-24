/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Epsg } from '@basemaps/geo';
import { Aws, LogConfig, RecordPrefix, TileMetadataImageryRecord, TileMetadataTable } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { createImageryRecordFromJob } from '../cogify/action.batch';
import { CogStacJob } from '../../cog/cog.stac.job';

export class ImageryImportAction extends CommandLineAction {
    private job: CommandLineStringParameter;
    private commit: CommandLineFlagParameter;
    private force: CommandLineFlagParameter;

    public constructor() {
        super({
            actionName: 'import',
            summary: 'Import imagery from job.json',
            documentation: '',
        });
    }

    protected onDefineParameters(): void {
        this.job = this.defineStringParameter({
            argumentName: 'JOB',
            parameterLongName: '--job',
            parameterShortName: '-j',
            description: 'Path to job.json',
            required: true,
        });

        this.force = this.defineFlagParameter({
            parameterLongName: '--force',
            description: 'Force overwrite',
            required: false,
        });

        this.commit = this.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Commit to database',
            required: false,
        });
    }

    async tryGetImagery(imgId: string): Promise<null | TileMetadataImageryRecord> {
        try {
            return await Aws.tileMetadata.Imagery.get(imgId);
        } catch (e) {
            return null;
        }
    }

    protected async onExecute(): Promise<void> {
        const logger = LogConfig.get();

        const jobPath = this.job.value!;
        if (!jobPath.startsWith('s3://')) throw new Error('Invalid job path, must start with s3://');

        logger.warn({ jobPath }, 'FetchingJob');

        const job = await CogStacJob.load(jobPath);

        const imgId = TileMetadataTable.prefix(RecordPrefix.Imagery, job.id);
        const imagery = await this.tryGetImagery(imgId);
        if (imagery != null && !this.force.value) {
            logger.warn({ imgId }, 'Imagery already exists, aborting');
            return;
        }

        logger.info({ imagery: job.name }, 'Importing');

        const imgRecord = createImageryRecordFromJob(job);

        if (imgRecord.year == -1) logger.warn({ imagery: job.name }, 'Failed to parse year');
        if (imgRecord.resolution == -1) logger.warn({ imagery: job.name }, 'Failed to parse resolution');
        if (Epsg.tryGet(imgRecord.projection) == null) {
            logger.error({ imagery: job.name, projection: imgRecord.projection }, 'Failed to parse projection');
            return;
        }

        logger.info({ record: imgRecord }, 'Create');
        if (this.commit.value) {
            logger.info({ imagery: job.name, imgId }, 'CreatingRecord');
            await Aws.tileMetadata.put(imgRecord);
        } else {
            logger.warn('DryRun:Done');
        }
    }
}
