import { LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@microsoft/ts-command-line';
import { promises as fs, createReadStream } from 'fs';
import * as ulid from 'ulid';
import { buildCogForQuadKey, CogJob } from '../../cog';
import { FileOperator } from '../../file/file';
import { FileOperatorSimple } from '../../file/file.local';
import { buildWarpedVrt } from '../../cog.vrt';

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
        const jobData = await FileOperator.create(this.job.value).read(this.job.value);
        const job = JSON.parse(jobData.toString()) as CogJob;
        const processId = ulid.ulid();

        const isCommit = this.commit?.value ?? false;

        const logger = LogConfig.get().child({ id: processId, correlationId: job.id });
        LogConfig.set(logger);

        const quadKey = this.quadKey?.value;
        if (quadKey == null || !job.quadkeys.includes(quadKey)) {
            logger.error({ quadKey, quadKeys: job.quadkeys.join(', ') }, 'Quadkey does not existing inside job');
            return;
        }

        const tmpFolder = `/tmp/basemaps-${job.id}-${processId}`;

        const tmpTiff = FileOperator.join(tmpFolder, `${quadKey}.tiff`);
        const tmpVrt = FileOperator.join(tmpFolder, `${job.id}.vrt`);
        await fs.mkdir(tmpFolder, { recursive: true });

        try {
            logger.info({ path: job.output.vrt.path }, 'FetchVrt');
            const outputFs = FileOperator.create(job.output);
            await FileOperatorSimple.write(tmpVrt, outputFs.readStream(job.output.vrt.path), logger);
            // Sometimes we need to force a epsg3857 projection to get the COG to build since its fast just do it locally
            const vrtPath = await buildWarpedVrt(job, tmpVrt, job.output.vrt.options, tmpFolder, logger);

            await buildCogForQuadKey(job, quadKey, vrtPath, tmpTiff, logger, isCommit);
            const targetPath = FileOperator.join(job.output.path, `${job.id}/${quadKey}.tiff`);
            logger.info({ target: targetPath }, 'StoreTiff');
            if (isCommit) {
                await outputFs.write(targetPath, createReadStream(tmpTiff), logger);
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
