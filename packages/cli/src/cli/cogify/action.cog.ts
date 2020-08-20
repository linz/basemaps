import { Env, FileOperator, LogConfig, LoggerFatalError, ProjectionTileMatrixSet } from '@basemaps/shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { createReadStream, promises as fs } from 'fs';
import { FeatureCollection } from 'geojson';
import { buildCogForName } from '../../cog/cog';
import { CogVrt } from '../../cog/cog.vrt';
import { Cutline } from '../../cog/cutline';
import { CogJob } from '../../cog/types';
import { Gdal } from '../../gdal/gdal';
import { CliId } from '../base.cli';
import { getJobPath, makeTempFolder } from '../folder';

export class ActionCogCreate extends CommandLineAction {
    private job?: CommandLineStringParameter;
    private name?: CommandLineStringParameter;
    private commit?: CommandLineFlagParameter;
    private cogIndex?: CommandLineIntegerParameter;

    public constructor() {
        super({
            actionName: 'cog',
            summary: 'create a COG',
            documentation: 'Create a COG for the specified cog name',
        });
    }

    getName(job: CogJob): string | null {
        const batchIndex = Env.getNumber(Env.BatchIndex, -1);
        if (batchIndex > -1) {
            const { name } = job.files[batchIndex];
            if (name == null) {
                throw new LoggerFatalError(
                    { cogIndex: batchIndex, tileMax: job.files.length - 1 },
                    'Failed to find cog name from batch index',
                );
            }
            return name;
        }

        const cogIndex = this.cogIndex?.value;
        if (cogIndex != null) {
            const { name } = job.files[cogIndex];
            if (name == null) {
                throw new LoggerFatalError(
                    { cogIndex, tileMax: job.files.length - 1 },
                    'Failed to find cog name from index',
                );
            }
            return name;
        }
        const name = this.name?.value;
        if (name == null || !job.files.find((r) => r.name === name)) {
            throw new LoggerFatalError(
                { name, names: job.files.map((r) => r.name).join(', ') },
                'Name does not exist inside job',
            );
        }
        return name;
    }

    async onExecute(): Promise<void> {
        const jobFn = this.job?.value;
        if (jobFn == null) throw new Error('Missing job name');

        const inFp = FileOperator.create(jobFn);
        const job = await FileOperator.readJson<CogJob>(jobFn, inFp);

        const isCommit = this.commit?.value ?? false;

        const logger = LogConfig.get().child({ correlationId: job.id, imageryName: job.name });
        LogConfig.set(logger);

        const gdalVersion = await Gdal.version(logger);
        logger.info({ version: gdalVersion }, 'GdalVersion');

        const name = this.getName(job);
        if (name == null) {
            return;
        }
        const targetPath = getJobPath(job, `${name}.tiff`);
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
                job.files.length == 1 && job.files[0].name == Cutline.OneCogName,
            );

            const tmpVrtPath = await CogVrt.buildVrt(tmpFolder, job, cutline, name, logger);

            if (tmpVrtPath == null) {
                logger.warn({ name }, 'NoMatchingSourceImagery');
                return;
            }

            const tmpTiff = FileOperator.join(tmpFolder, `${name}.tiff`);

            await buildCogForName(job, name, tmpVrtPath, tmpTiff, logger, isCommit);
            logger.info({ target: targetPath }, 'StoreTiff');
            if (isCommit) {
                await outputFs.write(targetPath, createReadStream(tmpTiff));
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

        this.name = this.defineStringParameter({
            argumentName: 'NAME',
            parameterLongName: '--name',
            description: 'cog name to process',
            required: false,
        });

        this.cogIndex = this.defineIntegerParameter({
            argumentName: 'COG_INDEX',
            parameterLongName: '--cog-index',
            description: 'index of cog to process',
            required: false,
        });

        this.commit = this.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Begin the transformation',
            required: false,
        });
    }
}
