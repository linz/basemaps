import { LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@microsoft/ts-command-line';
import { promises as fs } from 'fs';
import * as ulid from 'ulid';
import { buildCogForQuadKey, CogJob } from '../../cog';
import { FileOperator } from '../../file/file';

export class ActionCogCreate extends CommandLineAction {
    private job: CommandLineStringParameter | null = null;
    private quadKey: CommandLineStringParameter | null = null;
    private commit: CommandLineFlagParameter | null = null;

    public constructor() {
        super({
            actionName: 'create-cog',
            summary: 'create a COG',
            documentation: 'Create a COG from a vrt for the specified quadkey',
        });
    }

    async onExecute(): Promise<void> {
        if (this.job?.value == null) {
            throw new Error('Failed to read parameters');
        }
        const jobData = await FileOperator.get(this.job.value).read(this.job.value);
        const job = JSON.parse(jobData.toString()) as CogJob;
        const processId = ulid.ulid();

        const logger = LogConfig.get().child({ id: processId, correlationId: job.id });
        LogConfig.set(logger);

        const quadKey = this.quadKey?.value;
        if (quadKey == null || !job.quadkeys.includes(quadKey)) {
            logger.error({ quadKey, quadKeys: job.quadkeys.join(', ') }, 'Quadkey does not existing inside job');
            return;
        }

        const tmpFolder = `/tmp/basemaps-${job.id}-${processId}`;

        const tmpTiff = FileOperator.join(tmpFolder, `${quadKey}.tiff`);
        const tmpVrt = FileOperator.join(tmpFolder, `${processId}.vrt`);
        await fs.mkdir(tmpFolder, { recursive: true });

        try {
            logger.info({ path: job.source.vrt }, 'FetchVrt');
            await FileOperator.copy(job.source.vrt, tmpVrt, logger);

            await buildCogForQuadKey(
                quadKey,
                tmpVrt,
                job.source.files,
                tmpTiff,
                job.source.resolution,
                logger,
                this.commit?.value ?? false,
            );
            const targetPath = FileOperator.join(job.output, `${job.id}/${quadKey}.tiff`);
            logger.info({ target: targetPath }, 'StoreTiff');
            if (this.commit?.value) {
                await FileOperator.copy(tmpTiff, targetPath, logger);
            }
        } catch (err) {
            logger.error({ err }, 'FailedToConvert');
        } finally {
            // Cleanup!
            await fs.rmdir(tmpFolder, { recursive: true });
        }
    }

    protected onDefineParameters(): void {
        this.job = this.defineStringParameter({
            argumentName: 'JOB',
            parameterLongName: '--job',
            description: 'Job config source to access',
            required: true,
        });

        this.quadKey = this.defineStringParameter({
            argumentName: 'QUADKEY',
            parameterLongName: '--quadkey',
            description: 'quadkey to process',
            required: true,
        });

        this.commit = this.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Begin the transformation',
            required: false,
        });
    }
}
