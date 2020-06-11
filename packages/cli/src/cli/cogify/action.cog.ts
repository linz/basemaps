import { Env, FileOperator, LogConfig, LogType, ProjectionTileMatrixSet } from '@basemaps/shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { createReadStream, promises as fs } from 'fs';
import { FeatureCollection } from 'geojson';
import { buildCogForQuadKey } from '../../cog/cog';
import { Cutline } from '../../cog/cutline';
import { QuadKeyVrt } from '../../cog/quadkey.vrt';
import { CogJob } from '../../cog/types';
import { GdalCogBuilder } from '../../gdal/gdal';
import { CliId, CliInfo } from '../base.cli';
import { getJobPath, makeTempFolder } from '../folder';
import { SemVer } from './semver.util';

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
        const job = (await inFp.readJson(jobFn)) as CogJob;

        const jobVersion = SemVer.compare(job.generated?.version ?? '', CliInfo.version);
        if (jobVersion !== 0) {
            LogConfig.get().fatal({ jobInfo: job.generated, cli: CliInfo }, 'Version mismatch');
            return;
        }

        const isCommit = this.commit?.value ?? false;

        const logger = LogConfig.get().child({ correlationId: job.id, imageryName: job.name });
        LogConfig.set(logger);

        const gdalVersion = await GdalCogBuilder.getVersion(logger);
        logger.info({ version: gdalVersion }, 'GdalVersion');

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

        const tmpFolder = await makeTempFolder(`basemaps-${job.id}-${CliId}`);

        try {
            const sourceGeo = (await inFp.readJson(getJobPath(job, 'source.geojson'))) as FeatureCollection;

            let cutlineJson: FeatureCollection | undefined;
            if (job.output.cutline != null) {
                const cutlinePath = getJobPath(job, 'cutline.geojson.gz');
                logger.info({ path: cutlinePath }, 'UsingCutLine');
                cutlineJson = await Cutline.loadCutline(cutlinePath);
            } else {
                logger.warn('NoCutLine');
            }
            const cutline = new Cutline(
                ProjectionTileMatrixSet.get(job.projection),
                cutlineJson,
                job.output.cutline?.blend,
            );

            const tmpVrtPath = await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, quadKey, logger);

            if (tmpVrtPath == null) {
                logger.warn({ quadKey }, 'NoMatchingSourceImagery');
                return;
            }

            const tmpTiff = FileOperator.join(tmpFolder, `${quadKey}.tiff`);

            await buildCogForQuadKey(job, quadKey, tmpVrtPath, tmpTiff, logger, isCommit);
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
