import { TileMatrixSets } from '@basemaps/geo';
import { fsa, LogType, UrlArrayJsonFile } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { command, option, string } from 'cmd-ts';
import { basename } from 'path';
import { createGzip } from 'zlib';

import { createStacFiles } from '../stac.js';
// import { toTarIndex } from '../transform/covt.js';
// import { toTarTiles } from '../transform/mbtiles.to.ttiles.js';
// import { tileJoin } from '../transform/tippecanoe.js';

// async function download(filePaths: URL[], outputPath: string, logger: LogType): Promise<URL[]> {
//   const paths: URL[] = [];
//   for (const file of filePaths) {
//     if (file.protocol === 'file:') {
//       paths.push(file);
//     } else {
//       const fileName = basename(file.pathname);
//       if (fileName == null) throw new Error(`Unsupported source pathname ${file.pathname}`);
//       const localFile = fsa.toUrl(`${outputPath}/${fileName}`);
//       if (await fsa.exists(localFile)) {
//         logger.info({ file: file, fileName: fileName }, 'Download:FileExists');
//       } else {
//         logger.info({ file: file, fileName: fileName }, 'Download:Start');
//         const stream = fsa.readStream(file);
//         await fsa.write(localFile, stream);
//         logger.info({ file: file, fileName: fileName }, 'Download:End');
//       }
//       paths.push(localFile);
//     }
//   }
//   return paths;
// }

/**
 * Upload output file into s3 bucket
 *
 */
async function upload(file: URL, bucketPath: URL, logger: LogType): Promise<URL> {
  logger.info({ file: file.href }, 'Load:Start');
  let filename = basename(file.pathname);
  let stream = fsa.readStream(file);

  // gzip index file
  if (filename.endsWith('index')) {
    filename = `${filename}.gz`;
    stream = stream.pipe(createGzip());
  }

  // Upload to s3
  let path = new URL(`${CliId}/${filename}`, bucketPath);
  if (filename.endsWith('catalog.json')) path = new URL(filename, bucketPath); // Upload catalog to root directory
  await fsa.write(path, stream);
  logger.info({ file: file, path: path }, 'Load:Finish');
  return path;
}

export const JoinArgs = {
  ...logArguments,
  fromFile: option({
    type: UrlArrayJsonFile,
    long: 'from-file',
    description: 'Path to JSON file containing array of paths to mbtiles.',
  }),
  filename: option({
    type: string,
    long: 'filename',
    description: 'Output filename default topographic',
    defaultValue: () => 'topographic-v2',
    defaultValueIsSerializable: true,
  }),
  tileMatrix: option({
    type: string,
    long: 'tile-matrix',
    description: `Output TileMatrix to use WebMercatorQuad or NZTM2000Quad`,
    defaultValue: () => 'WebMercatorQuad',
    defaultValueIsSerializable: true,
  }),
  title: option({
    type: string,
    long: 'title',
    description: 'Title for the output etl data in the STAC file',
    defaultValue: () => 'Topographic',
    defaultValueIsSerializable: true,
  }),
  target: option({
    type: string,
    long: 'target',
    description: 'Path of target location, could be local or s3',
  }),
};

export const JoinCommand = command({
  name: 'join',
  version: CliInfo.version,
  description: 'Join vector mbtiles',
  args: JoinArgs,
  async handler(args) {
    const logger = getLogger(this, args, 'cli-vector');
    const outputPath = `tmp/join/`;
    // const filePaths = await download(args.fromFile, outputPath, logger);

    const outputMbtiles = fsa.toUrl(`${outputPath}/${args.filename}.mbtiles`);
    // logger.info({ files: filePaths.length, outputMbtiles }, 'JoinMbtiles: Start');
    // await tileJoin(filePaths, outputMbtiles, logger);
    // logger.info({ files: filePaths.length, outputMbtiles }, 'JoinMbtiles: End');

    const outputCotar = fsa.toUrl(`${outputPath}/${args.filename}.tar.co`);
    // logger.info({ mbtiles: outputMbtiles, outputCotar }, 'ToTartTiles: Start');
    // await toTarTiles(outputMbtiles, outputCotar, logger);
    // logger.info({ mbtiles: outputMbtiles, outputCotar }, 'ToTartTiles: End');

    const outputIndex = fsa.toUrl(`${outputPath}/${args.filename}.tar.index`);
    // logger.info({ cotar: outputCotar, outputIndex }, 'toTarIndex: Start');
    // await toTarIndex(outputCotar, outputIndex, logger);
    // logger.info({ cotar: outputCotar, outputIndex }, 'toTarIndex: End');

    const tileMatrix = TileMatrixSets.find(args.tileMatrix);
    if (tileMatrix == null) throw new Error(`Tile matrix ${args.tileMatrix} is not supported`);
    const bucketPath = new URL(`vector/${tileMatrix.projection.code}/`, args.target);
    // logger.info({ target: bucketPath, tileMatrix: tileMatrix.identifier }, 'CreateStac: Start');
    const stacFiles = await createStacFiles(args.fromFile, bucketPath, args.filename, tileMatrix, args.title, logger);
    // logger.info({ cotar: outputCotar, outputIndex }, 'CreateStac: End');

    // Upload output to s3
    logger.info({ target: bucketPath, tileMatrix: tileMatrix.identifier }, 'Upload: Start');
    await upload(outputMbtiles, bucketPath, logger);
    await upload(outputCotar, bucketPath, logger);
    await upload(outputIndex, bucketPath, logger);
    // Upload stac Files
    for (const file of stacFiles) {
      await upload(file, bucketPath, logger);
    }
    logger.info({ target: bucketPath, tileMatrix: tileMatrix.identifier }, 'Upload: End');
  },
});
