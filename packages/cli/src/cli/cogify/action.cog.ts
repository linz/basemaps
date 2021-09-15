import { Env, fsa, LogConfig, LoggerFatalError } from '@basemaps/shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { createReadStream, promises as fs } from 'fs';
import { FeatureCollection } from 'geojson';
import { buildCogForName } from '../../cog/cog.js';
import { CogStacJob } from '../../cog/cog.stac.job.js';
import { CogVrt } from '../../cog/cog.vrt.js';
import { Cutline } from '../../cog/cutline.js';
import { CogJob } from '../../cog/types.js';
import { Gdal } from '../../gdal/gdal.js';
import { CliId } from '../base.cli.js';
import { makeTempFolder } from '../folder.js';

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
        const { files } = job.output;
        const batchIndex = Env.getNumber(Env.BatchIndex, -1);
        if (batchIndex > -1) {
            const { name } = files[batchIndex];
            if (name == null) {
                throw new LoggerFatalError(
                    { cogIndex: batchIndex, tileMax: files.length - 1 },
                    'Failed to find cog name from batch index',
                );
            }
            return name;
        }

        const cogIndex = this.cogIndex?.value;
        if (cogIndex != null) {
            const { name } = files[cogIndex];
            if (name == null) {
                throw new LoggerFatalError(
                    { cogIndex, tileMax: files.length - 1 },
                    'Failed to find cog name from index',
                );
            }
            return name;
        }
        const name = this.name?.value;
        if (name == null || !files.find((r) => r.name === name)) {
            throw new LoggerFatalError(
                { name, names: files.map((r) => r.name).join(', ') },
                'Name does not exist inside job',
            );
        }
        return name;
    }

    async onExecute(): Promise<void> {
        const jobFn = this.job?.value;
        if (jobFn == null) throw new Error('Missing job name');

        const job = await CogStacJob.load(jobFn);
        const isCommit = this.commit?.value ?? false;

        const logger = LogConfig.get().child({ correlationId: job.id, imageryName: job.name });
        LogConfig.set(logger);

        const gdalVersion = await Gdal.version(logger);
        logger.info({ version: gdalVersion }, 'GdalVersion');

        const name = this.getName(job);
        if (name == null) return;

        const targetPath = job.getJobPath(`${name}.tiff`);
        fsa.configure(job.output.location);

        const outputExists = await fsa.exists(targetPath);
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
                const cutlinePath = job.getJobPath('cutline.geojson.gz');
                logger.info({ path: cutlinePath }, 'UsingCutLine');
                cutlineJson = await Cutline.loadCutline(cutlinePath);
            } else {
                logger.warn('NoCutLine');
            }
            const cutline = new Cutline(
                job.tileMatrix,
                cutlineJson,
                job.output.cutline?.blend,
                job.output.oneCogCovering,
            );

            const tmpVrtPath = await CogVrt.buildVrt(tmpFolder, job, cutline, name, logger);

            if (tmpVrtPath == null) {
                logger.warn({ name, tileMatrix: job.tileMatrix.identifier }, 'NoMatchingSourceImagery');
                return;
            }

            const tmpTiff = fsa.join(tmpFolder, `${name}.tiff`);

            await buildCogForName(job, name, tmpVrtPath, tmpTiff, logger, isCommit);
            logger.info({ target: targetPath }, 'StoreTiff');
            if (isCommit) {
                await fsa.write(targetPath, createReadStream(tmpTiff));
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
