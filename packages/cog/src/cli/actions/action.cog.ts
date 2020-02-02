import { Env, FileOperator, FileOperatorSimple, LogConfig, LogType } from '@basemaps/shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@microsoft/ts-command-line';
import { createReadStream, promises as fs } from 'fs';
import * as ulid from 'ulid';
import { buildCogForQuadKey, CogJob } from '../../cog';
import { buildWarpedVrt } from '../../cog.vrt';
import { makeTempFolder, getJobPath } from '../folder';

export class ActionCogCreate extends CommandLineAction {
    private job?: CommandLineStringParameter;
    private quadKey?: CommandLineStringParameter;
    private commit?: CommandLineFlagParameter;
    private quadKeyIndex?: CommandLineIntegerParameter;

    public constructor() {
        super({
            actionName: 'cog',
            summary: 'create a COG',
            documentation: 'Create a COG from a vrt for the specified quadkey',
        });
    }

    getQuadKey(job: CogJob, logger: LogType): string | null {
        const batchIndex = Env.getNumber(Env.BatchIndex, -1);
        if (batchIndex > -1) {
            const qk = job.quadkeys[batchIndex];
            if (qk == null) {
                logger.fatal(
                    { quadKeyIndex: batchIndex, quadKeyMax: job.quadkeys.length - 1 },
                    'Failed to find quadkey from batch index',
                );
                return null;
            }
            return qk;
        }

        const quadKey = this.quadKey?.value;
        const quadKeyIndex = this.quadKeyIndex?.value;
        if (quadKeyIndex != null) {
            const qk = job.quadkeys[quadKeyIndex];
            if (qk == null) {
                logger.fatal(
                    { quadKeyIndex, quadKeyMax: job.quadkeys.length - 1 },
                    'Failed to find quadkey from index',
                );
                return null;
            }
            return qk;
        }
        if (quadKey == null || !job.quadkeys.includes(quadKey)) {
            logger.fatal({ quadKey, quadKeys: job.quadkeys.join(', ') }, 'Quadkey does not existing inside job');
            return null;
        }
        return quadKey;
    }

    async onExecute(): Promise<void> {
        if (this.job?.value == null) {
            throw new Error('Failed to read parameters');
        }
        const jobData = await FileOperator.create(this.job.value).read(this.job.value);
        const job = JSON.parse(jobData.toString()) as CogJob;
        const processId = ulid.ulid();

        const isCommit = this.commit?.value ?? false;

        const logger = LogConfig.get().child({ id: processId, correlationId: job.id, imageryName: job.name });
        LogConfig.set(logger);

        const quadKey = this.getQuadKey(job, logger);
        if (quadKey == null) {
            return;
        }
        const targetPath = getJobPath(job, `${quadKey}.tiff`);
        const outputFs = FileOperator.create(job.output);

        const outputExists = await outputFs.exists(targetPath);
        logger.info({ targetPath, outputExists }, 'CheckExists');
        // Output file exists don't try and overwrite it
        if (outputExists) {
            logger.warn({ targetPath }, 'OutputExists');
            return;
        }

        const tmpFolder = await makeTempFolder(`basemaps-${job.id}-${processId}`);

        const tmpTiff = FileOperator.join(tmpFolder, `${quadKey}.tiff`);
        const tmpVrt = FileOperator.join(tmpFolder, `${job.id}.vrt`);

        try {
            logger.info({ path: getJobPath(job, '.vrt') }, 'FetchVrt');
            await FileOperatorSimple.write(tmpVrt, outputFs.readStream(getJobPath(job, '.vrt')), logger);
            // Sometimes we need to force a epsg3857 projection to get the COG to build since its fast just do it locally
            const vrtPath = await buildWarpedVrt(job, tmpVrt, job.output.vrt.options, tmpFolder, logger);

            await buildCogForQuadKey(job, quadKey, vrtPath, tmpTiff, logger, isCommit);
            logger.info({ target: targetPath }, 'StoreTiff');
            if (isCommit) {
                await outputFs.write(targetPath, createReadStream(tmpTiff), logger);
            } else {
                logger.warn('DryRun:Done');
            }
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
            required: false,
        });

        this.quadKeyIndex = this.defineIntegerParameter({
            argumentName: 'QUADKEY_INDEX',
            parameterLongName: '--quadkey-index',
            description: 'quadkey index to process',
            required: false,
        });

        this.commit = this.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Begin the transformation',
            required: false,
        });
    }
}
