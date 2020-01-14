import { EPSG, LogConfig } from '@basemaps/shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@microsoft/ts-command-line';
import { promises as fs } from 'fs';
import * as ulid from 'ulid';
import { CogBuilder } from '../../builder';
import { CogJob } from '../../cog';
import { buildVrtForTiffs, VrtOptions } from '../../cog.vrt';
import { FileOperator } from '../../file/file';
import { TileCover } from '../../cover';

const ProcessId = ulid.ulid();

function filterTiff(a: string): boolean {
    const lowerA = a.toLowerCase();
    return lowerA.endsWith('.tiff') || lowerA.endsWith('.tif');
}

export class ActionCogJobCreate extends CommandLineAction {
    private source: CommandLineStringParameter | null = null;
    private output: CommandLineStringParameter | null = null;
    private minZoom: CommandLineIntegerParameter | null = null;
    private maxCogs: CommandLineIntegerParameter | null = null;
    private maxConcurrency: CommandLineIntegerParameter | null = null;
    private imageryName: CommandLineStringParameter | null = null;
    private geoJsonOutput: CommandLineFlagParameter | null = null;
    private generateVrt: CommandLineFlagParameter | null = null;

    MaxCogsDefault = 50;
    MaxConcurrencyDefault = 5;
    MinZoomDefault = 1;

    public constructor() {
        super({
            actionName: 'job',
            summary: 'create a list of cogs that need to be processed',
            documentation: 'List a folder/bucket full of cogs and determine a optimal processing pipeline',
        });
    }

    async onExecute(): Promise<void> {
        const logger = LogConfig.get().child({ id: ProcessId });
        LogConfig.set(logger);

        // Make typescript happy with all the undefined
        if (this.source?.value == null || this.output?.value == null || this.imageryName?.value == null) {
            throw new Error('Failed to read parameters');
        }

        logger.info({ source: this.source.value }, 'ListTiffs');
        const tiffList = (await FileOperator.get(this.source.value).list(this.source.value)).filter(filterTiff);

        logger.info({ source: this.source.value, tiffCount: tiffList.length }, 'LoadingTiffs');
        const builder = new CogBuilder(
            this.maxConcurrency?.value ?? this.MaxConcurrencyDefault,
            this.maxCogs?.value ?? this.MaxCogsDefault,
            this.minZoom?.value ?? this.MinZoomDefault,
        );
        const metadata = await builder.build(tiffList);
        logger.info({ covering: metadata.covering }, 'CoveringGenerated');

        const vrtOptions: VrtOptions = { addAlpha: true, forceEpsg3857: true };
        // -addalpha to vrt adds extra alpha layers even if one already exist
        if (metadata.bands > 3) {
            logger.warn({ bandCount: metadata.bands }, 'Vrt:DetectedAlpha, Disabling -addalpha');
            vrtOptions.addAlpha = false;
        }

        // If the source imagery is in 900931, no need to force a warp
        if (metadata.projection == EPSG.Google) {
            logger.warn({ bandCount: metadata.bands }, 'Vrt:GoogleProjection, Disabling warp');
            vrtOptions.forceEpsg3857 = false;
        }
        const job: CogJob = {
            id: ProcessId,
            output: this.output.value,
            source: {
                name: this.imageryName.value,
                resolution: metadata.resolution,
                files: tiffList,
                vrt: FileOperator.join(this.output.value, `${ProcessId}/.vrt`),
            },
            quadkeys: metadata.covering,
        };

        const tmpFolder = `/tmp/basemaps-${job.id}`;
        await fs.mkdir(tmpFolder, { recursive: true });
        try {
            const outputFs = FileOperator.get(this.output.value);
            // Local file systems need directories to be created before writing to them
            if (!FileOperator.isS3(this.output.value)) {
                await fs.mkdir(FileOperator.join(this.output.value, ProcessId), { recursive: true });
            }

            if (this.generateVrt?.value) {
                const vrtTmp = await buildVrtForTiffs(job, vrtOptions, tmpFolder, logger);
                await FileOperator.copy(vrtTmp, job.source.vrt, logger);
            }

            const jobFile = FileOperator.join(this.output.value, `${ProcessId}/job.json`);
            await outputFs.write(jobFile, Buffer.from(JSON.stringify(job, null, 2)), logger);

            if (this.geoJsonOutput?.value) {
                const geoJsonSourceOutput = FileOperator.join(this.output.value, `${ProcessId}/source.geojson`);
                await outputFs.write(
                    geoJsonSourceOutput,
                    Buffer.from(JSON.stringify(metadata.bounds, null, 2)),
                    logger,
                );

                const geoJsonCoveringOutput = FileOperator.join(this.output.value, `${ProcessId}/covering.geojson`);
                await outputFs.write(
                    geoJsonCoveringOutput,
                    Buffer.from(JSON.stringify(TileCover.toGeoJson(metadata.covering), null, 2)),
                    logger,
                );
            }

            logger.info({ job: jobFile }, 'Done');
        } catch (e) {
            logger.error({ error: e }, 'FailedToConvert');
        } finally {
            // Cleanup
            await fs.rmdir(tmpFolder, { recursive: true });
        }
    }

    protected onDefineParameters(): void {
        this.source = this.defineStringParameter({
            argumentName: 'SOURCE',
            parameterLongName: '--source',
            description: 'Folder or S3 Bucket to load from',
            required: true,
        });

        this.output = this.defineStringParameter({
            argumentName: 'SOURCE',
            parameterLongName: '--output',
            description: 'Folder or S3 Bucket to store results in',
            required: true,
        });

        this.minZoom = this.defineIntegerParameter({
            argumentName: 'MIN_ZOOM',
            parameterLongName: '--min-zoom',
            description: 'min zoom level to use',
            defaultValue: this.MinZoomDefault,
            required: false,
        });

        this.maxCogs = this.defineIntegerParameter({
            argumentName: 'MAX_COGS',
            parameterLongName: '--max-cogs',
            description: 'Maximum number of COGs to create',
            defaultValue: this.MaxCogsDefault,
            required: false,
        });

        this.maxConcurrency = this.defineIntegerParameter({
            argumentName: 'MAX_CONCURRENCY',
            parameterLongName: '--concurrency',
            parameterShortName: '-c',
            description: 'Maximum number of requests to use at one time',
            defaultValue: this.MaxConcurrencyDefault,
            required: false,
        });

        this.imageryName = this.defineStringParameter({
            argumentName: 'IMAGERY_SET_NAME',
            parameterLongName: '--name',
            parameterShortName: '-n',
            description: 'Name of imagery set',
            required: true,
        });

        this.geoJsonOutput = this.defineFlagParameter({
            parameterLongName: '--geojson',
            description: 'Export GeoJSON bounding boxes of source tiffs and generated COGs',
            required: false,
        });

        this.generateVrt = this.defineFlagParameter({
            parameterLongName: '--vrt',
            description: 'Generate the source vrt for the COGs',
            required: false,
        });
    }
}
