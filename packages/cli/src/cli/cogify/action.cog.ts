import { Env, FileOperator, LogConfig, LogType, ProjectionTileMatrixSet } from '@basemaps/shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { createReadStream, promises as fs } from 'fs';
import { FeatureCollection } from 'geojson';
import { buildCogForName } from '../../cog/cog';
import { Cutline } from '../../cog/cutline';
import { CogVrt } from '../../cog/cog.vrt';
import { CogJob } from '../../cog/types';
import { GdalCogBuilder } from '../../gdal/gdal';
import { CliId, CliInfo } from '../base.cli';
import { getJobPath, makeTempFolder } from '../folder';
import { SemVer } from './semver.util';

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

    getName(job: CogJob, logger: LogType): string | null {
        const batchIndex = Env.getNumber(Env.BatchIndex, -1);
        if (batchIndex > -1) {
            const { name } = job.files[batchIndex];
            if (name == null) {
                logger.fatal(
                    { cogIndex: batchIndex, tileMax: job.files.length - 1 },
                    'Failed to find cog name from batch index',
                );
                return null;
            }
            return name;
        }

        const cogIndex = this.cogIndex?.value;
        if (cogIndex != null) {
            const { name } = job.files[cogIndex];
            if (name == null) {
                logger.fatal({ cogIndex, tileMax: job.files.length - 1 }, 'Failed to find cog name from index');
                return null;
            }
            return name;
        }
        const name = this.name?.value;
        if (name == null || !job.files.find((r) => r.name === name)) {
            logger.fatal({ name, names: job.files.map((r) => r.name).join(', ') }, 'Name does not exist inside job');
            return null;
        }
        return name;
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

        const name = this.getName(job, logger);
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

            const tmpVrtPath = await CogVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, name, logger);

            if (tmpVrtPath == null) {
                logger.warn({ name }, 'NoMatchingSourceImagery');
                return;
            }

            const tmpTiff = FileOperator.join(tmpFolder, `${name}.tiff`);

            await buildCogForName(job, name, tmpVrtPath, tmpTiff, logger, isCommit);
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
