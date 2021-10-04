import { BaseCommandLine } from '@basemaps/cli/build/cli/base.cli.js';
import { makeTempFolder } from '@basemaps/cli/build/cli/folder.js';
import { GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { Env, fsa, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { createReadStream, promises as fs } from 'fs';
import * as os from 'os';
import * as ulid from 'ulid';
import { TerrariumMaker } from './terrarium.js';

/** This zoom level gives a good enough quality world while not making too many tiles */
const GoodZoom = GoogleTms.def.tileMatrix[4];

class CreateAction extends CommandLineAction {
  private inputPath: CommandLineStringParameter;
  private outputPath: CommandLineStringParameter;
  private docker: CommandLineFlagParameter;
  private tileMatrix: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'create',
      summary: 'create terrarium imagery',
      documentation: 'Take DEM data and convert it into terrarium geotiffs.',
    });
  }

  protected onDefineParameters(): void {
    this.inputPath = this.defineStringParameter({
      argumentName: 'PATH',
      parameterLongName: '--input',
      description: 'Folder or S3 Bucket location of DEM tiff file',
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

    this.tileMatrix = this.defineStringParameter({
      argumentName: 'TILE_MATRIX_SET',
      parameterLongName: '--tile-matrix-set',
      description: 'Tile matrix set to use for the final cutting',
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
    logger.level = 'trace';

    logger.info({ source: pathToFile }, 'MakeTerrarium');

    const tmpFolder = await makeTempFolder(`terrarium-${ulid.ulid()}`);

    try {
      const outputPath = this.outputPath.value!;

      /** Find a decent zoom level that is close to the good zoom at google's scale */
      let bestZ = tileMatrix.findBestZoom(GoodZoom.scaleDenominator + 1);

      // Make at least a few tiles
      if (bestZ === 0) bestZ++;

      const terrarium = new TerrariumMaker(
        {
          id: ulid.ulid(),
          inputPath: this.inputPath.value!,
          outputPath,
          tmpFolder,
          tileMatrix,
          zoom: bestZ,
          threads: os.cpus().length / 2,
        },
        logger,
      );
      const output = await terrarium.render();
      console.log({ output });
      // await fsa.write(fsa.join(outputPath, `terrarium.cog.tiff`), createReadStream(output));
    } finally {
      // await fs.rmdir(tmpFolder, { recursive: true });
    }
  }
}

export class TerrariumCommandLine extends BaseCommandLine {
  constructor() {
    super({
      toolFilename: 'terrarium',
      toolDescription: 'Create terrarium imagery from DEM data',
    });
    this.addAction(new CreateAction());
  }
}

new TerrariumCommandLine().run();
