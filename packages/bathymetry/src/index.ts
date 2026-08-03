import { GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { Env, fsa, getLogger, logArguments, LogConfig, Url, UrlFolder } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, flag, number, option, optional, run, string, subcommands } from 'cmd-ts';
import { createReadStream, promises as fs } from 'fs';
import * as os from 'os';
import path from 'path';
import * as ulid from 'ulid';

import { BathyMaker } from './bathy.maker.js';
import { FilePath, FileType } from './file.js';
import { makeTempFolder } from './folder.js';

/** This zoom level gives a good enough quality world while not making too many tiles */
const GoodZoom = GoogleTms.def.tileMatrix[4];

export const BathymetryCreateCommand = command({
  name: 'create',
  version: CliInfo.version,
  description: 'Take batheymetric data and convert it into a set of colorized hillshaded geotiffs.',
  args: {
    ...logArguments,
    input: option({
      type: Url,
      long: 'input',
      description: 'Location of Gebco netcdf or tiff file',
    }),
    output: option({
      type: UrlFolder,
      long: 'output',
      description: 'Folder or S3 Bucket location to store imagery in',
    }),
    docker: flag({
      long: 'docker',
      description: 'Run inside a docker container',
    }),
    tileMatrixSet: option({
      type: optional(string),
      long: 'tile-matrix-set',
      description: 'Tile matrix set to use for the final cutting',
    }),
    zoomLevel: option({
      type: optional(number),
      long: 'zoom-level',
      description: 'Zoom level to use for the final cutting',
    }),
    tileSize: option({
      type: optional(number),
      long: 'tile-size',
      description: 'Pixel size of output tiles',
      defaultValue: () => 8192,
      defaultValueIsSerializable: true,
    }),
  },
  async handler(args) {
    const logger = getLogger(this, args, 'bathymetry');

    if (args.docker) {
      process.env[Env.Gdal.UseDocker] = 'true';
      if (process.env[Env.Gdal.DockerContainerTag] == null) {
        process.env[Env.Gdal.DockerContainerTag] = 'ubuntu-full-latest';
      }
    }

    const tileMatrixInput = args.tileMatrixSet ?? GoogleTms.identifier;
    const tileMatrix = TileMatrixSets.find(tileMatrixInput);
    if (tileMatrix == null) {
      throw new Error(
        'Unknown tile matrix set: ' +
          tileMatrixInput +
          ' Aviaiable tile matrix sets: ' +
          TileMatrixSets.All.map((c) => c.identifier).join(', '),
      );
    }

    logger.info({ source: args.input }, 'MakeBathy');

    const tmpFolder = new FilePath(await makeTempFolder(`bathymetry-${ulid.ulid()}`));

    try {
      /** Find a decent zoom level that is close to the good zoom at google's scale */
      let bestZ = args.zoomLevel ?? tileMatrix.findBestZoom(GoodZoom.scaleDenominator + 1);

      // Make at least a few tiles
      if (bestZ === 0) bestZ++;

      const bathy = new BathyMaker({
        id: ulid.ulid(),
        inputPath: args.input,
        outputPath: args.output,
        tmpFolder,
        tileMatrix,
        zoom: bestZ,
        tileSize: args.tileSize,
        threads: os.cpus().length / 2,
      });
      await bathy.render(logger);

      const srcPath = path.join(tmpFolder.sourcePath, String(FileType.Output));

      for (const file of await fs.readdir(srcPath)) {
        await fsa.write(new URL(file, args.output), createReadStream(path.join(srcPath, file)));
      }
    } finally {
      // await fs.rm(tmpFolder.sourcePath, { recursive: true });
    }
  },
});

export const BathymetryCli = subcommands({
  name: 'bathymetry',
  cmds: {
    create: BathymetryCreateCommand,
  },
});

run(BathymetryCli, process.argv.slice(2)).catch((err) => {
  const logger = LogConfig.get();
  logger.fatal({ err }, 'Command:Failed');

  // Give the logger some time to flush before exiting
  setTimeout(() => process.exit(1), 25);
});
