import { Env, FileOperator, FileOperatorSimple, LogConfig, LogType } from '@basemaps/lambda-shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { createReadStream, promises as fs } from 'fs';
import { FeatureCollection } from 'geojson';
import * as ulid from 'ulid';
import { buildCogForQuadKey, CogJob } from '../../cog/cog';
import { QuadKeyVrt } from '../../cog/quadkey.vrt';
import { buildWarpedVrt } from '../../cog/cog.vrt';
import { getJobPath, makeTempFolder } from '../folder';

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
            logger.fatal({ quadKey, quadKeys: job.quadkeys.join(', ') }, 'Quadkey does not exist inside job');
            return null;
        }
        return quadKey;
    }

    async onExecute(): Promise<void> {
        const jobFn = this.job?.value!;

        const inFp = FileOperator.create(jobFn);
        const job = JSON.parse((await inFp.read(jobFn)).toString()) as CogJob;
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

        try {
            const sourceGeo = JSON.parse(
                (await inFp.read(getJobPath(job, 'source.geojson'))).toString(),
            ) as FeatureCollection;

            const vrtString = await outputFs.read(getJobPath(job, '.vrt'));

            let cutline: FeatureCollection | null = null;
            if (job.output.cutlineBlend != null) {
                const cutlinePath = getJobPath(job, 'cutline.geojson');
                cutline = JSON.parse(
                    (await FileOperator.create(cutlinePath).read(cutlinePath)).toString(),
                ) as FeatureCollection;
            }

            const vrt = await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, vrtString, quadKey, logger);

            const tmpTiff = FileOperator.join(tmpFolder, `${quadKey}.tiff`);
            const tmpVrt = FileOperator.join(tmpFolder, `${job.id}.vrt`);

            await FileOperatorSimple.write(tmpVrt, Buffer.from(vrt.toString()), logger);

            // Sometimes we need to force a epsg3857 projection to get the COG to build since its fast just do it locally
            const warpedVrtPath = await buildWarpedVrt(job, tmpVrt, job.output.vrt.options, tmpFolder, logger);

            await buildCogForQuadKey(job, quadKey, warpedVrtPath, tmpTiff, logger, isCommit);
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
