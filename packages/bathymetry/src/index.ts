import { BaseCommandLine, CliId } from '@basemaps/cli/build/cli/base.cli.js';
import { makeTempFolder } from '@basemaps/cli/build/cli/folder.js';
import { GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { Env, fsa, LogConfig } from '@basemaps/shared';
import {
  CommandLineAction,
  CommandLineFlagParameter,
  CommandLineIntegerParameter,
  CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { createReadStream, promises as fs } from 'fs';
import * as os from 'os';
import { BathyMaker } from './bathy.maker.js';
import { FilePath, FileType } from './file.js';

/** This zoom level gives a good enough quality world while not making too many tiles */
const GoodZoom = GoogleTms.def.tileMatrix[4];

class CreateAction extends CommandLineAction {
  private inputPath: CommandLineStringParameter;
  private outputPath: CommandLineStringParameter;
  private docker: CommandLineFlagParameter;
  private tileMatrix: CommandLineStringParameter;
  private zoomLevel: CommandLineIntegerParameter;
  private tileSize: CommandLineIntegerParameter;
  private verbose: CommandLineFlagParameter;

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

    this.verbose = this.defineFlagParameter({
      parameterLongName: '--verbose',
      description: 'Verbose logging',
      required: false,
    });

    this.tileMatrix = this.defineStringParameter({
      argumentName: 'TILE_MATRIX_SET',
      parameterLongName: '--tile-matrix-set',
      description: 'Tile matrix set to use for the final cutting',
      required: false,
    });

    this.zoomLevel = this.defineIntegerParameter({
      argumentName: 'ZOOM',
      parameterLongName: '--zoom',
      description: 'Zoom level of the tile matrix set to split the source datasets into',
      required: false,
    });

    this.tileSize = this.defineIntegerParameter({
      argumentName: 'ZOOM',
      parameterLongName: '--tile-size',
      description: 'Number of pixels to use per tile, should be a power of two',
      required: false,
      defaultValue: 8192,
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
    const tileMatrixInput = this.tileMatrix.value ?? GoogleTms.identifier;
    const tileMatrix = TileMatrixSets.find(tileMatrixInput);
    if (tileMatrix == null) {
      throw new Error(
        'Unknown tile matrix set: ' +
          tileMatrixInput +
          ' Aviaiable tile matrix sets: ' +
          TileMatrixSets.All.map((c) => c.identifier).join(', '),
      );
    }

    const logger = LogConfig.get();
    if (this.verbose.value) logger.level = 'trace';

    const tmpFolder = new FilePath(await makeTempFolder(`bathymetry-${CliId}`));

    try {
      const outputPath = this.outputPath.value!;

      /** Find a decent zoom level that is close to the good zoom at google's scale */
      let bestZ = tileMatrix.findBestZoom(GoodZoom.scaleDenominator + 1);

      // Make at least a few tiles
      if (bestZ === 0) bestZ++;

      const bathy = new BathyMaker({
        id: CliId,
        inputPath: this.inputPath.value!,
        outputPath,
        tmpFolder,
        tileMatrix,
        zoom: this.zoomLevel.value ?? bestZ,
        threads: os.cpus().length / 2,
        tileSize: this.tileSize.value,
      });

      logger.info(
        {
          source: pathToFile,
          tileSize: bathy.config.tileSize,
          tileMatrix: bathy.config.tileMatrix.identifier,
          threads: bathy.config.threads,
          zoom: bathy.config.zoom,
        },
        'MakeBathy',
      );

      await bathy.render(logger);

      const srcPath = fsa.join(tmpFolder.sourcePath, String(FileType.Output));

      for (const file of await fs.readdir(srcPath)) {
        const target = fsa.join(outputPath, file);
        await fsa.write(target, createReadStream(fsa.join(srcPath, file)));
        logger.info({ path: target }, 'WritingFile');
      }
    } finally {
      await fs.rm(tmpFolder.sourcePath, { recursive: true });
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
