import { BaseCommandLine } from '@basemaps/cli/build/cli/base.cli';
import { makeTempFolder } from '@basemaps/cli/build/cli/folder';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Env, FileOperator, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import * as ulid from 'ulid';
import { createReadStream, promises as fs } from 'fs';
import { BathyMaker } from './bathy.maker';
import { FilePath, FileType } from './file';

class CreateAction extends CommandLineAction {
    private inputPath: CommandLineStringParameter;
    private outputPath: CommandLineStringParameter;
    private docker: CommandLineFlagParameter;

    public constructor() {
        super({
            actionName: 'create',
            summary: 'create bathymetry imagery',
            documentation: 'Take batheymetric data and convert it into a set of colorized hillshaded geotiffs.',
        });
    }

    protected onDefineParameters(): void {
        this.inputPath = this.defineStringParameter({
            argumentName: 'PATH',
            parameterLongName: '--input',
            description: 'Folder or S3 Bucket location of Gebco netcdf or tiff file',
            required: true,
        });

        this.outputPath = this.defineStringParameter({
            argumentName: 'PATH',
            parameterLongName: '--output',
            description: 'Folder or S3 Bucket location to store imagery in',
            required: true,
        });

        this.docker = this.defineFlagParameter({
            parameterLongName: '--docker',
            description: 'Run inside a docker container',
            required: false,
        });
    }

    async onExecute(): Promise<void> {
        const isDocker = !!this.docker.value;
        const pathToFile = this.inputPath.value!;

        if (isDocker) {
            process.env[Env.Gdal.UseDocker] = 'true';
            if (process.env[Env.Gdal.DockerContainerTag] == null) {
                process.env[Env.Gdal.DockerContainerTag] = 'ubuntu-full-latest';
            }
        }

        const logger = LogConfig.get();

        logger.info({ source: pathToFile }, 'MakeBathy');

        const tmpFolder = new FilePath(await makeTempFolder(`bathymetry-${ulid.ulid()}`));

        try {
            const outputPath = this.outputPath.value!;

            const bathy = new BathyMaker({
                id: ulid.ulid(),
                inputPath: this.inputPath.value!,
                outputPath,
                tmpFolder,
                tms: GoogleTms,
                zoom: 4,
                threads: 8,
            });
            await bathy.render(logger);

            const srcPath = FileOperator.join(tmpFolder.sourcePath, String(FileType.Output));

            for (const file of await fs.readdir(srcPath)) {
                await FileOperator.write(
                    FileOperator.join(outputPath, file),
                    createReadStream(FileOperator.join(srcPath, file)),
                );
            }
        } finally {
            await fs.rmdir(tmpFolder.sourcePath, { recursive: true });
        }
    }
}

export class BathymetryCommandLine extends BaseCommandLine {
    constructor() {
        super({
            toolFilename: 'bathymetry',
            toolDescription: 'Create source imagery from bathymetry data',
        });
        this.addAction(new CreateAction());
    }
}

new BathymetryCommandLine().run();
