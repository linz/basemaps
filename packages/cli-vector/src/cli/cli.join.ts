import { TileMatrixSets } from '@basemaps/geo';
import { fsa, isArgo, LogType, Url, UrlArrayJsonFile, urlToString } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { command, option, optional, string } from 'cmd-ts';
import { mkdir } from 'fs/promises';
import path, { basename, dirname } from 'path';
import { createGzip } from 'zlib';

import { createStacFiles } from '../stac.js';
import { toTarIndex } from '../transform/covt.js';
import { toTarTiles } from '../transform/mbtiles.to.ttiles.js';
import { tileJoin } from '../transform/tippecanoe.js';

async function download(filePaths: URL[], outputPath: string, logger: LogType): Promise<URL[]> {
  const paths: URL[] = [];
  for (const file of filePaths) {
    if (file.protocol === 'file:') {
      paths.push(file);
    } else {
      const fileName = basename(file.pathname);
      if (fileName == null) throw new Error(`Unsupported source pathname ${file.pathname}`);
      const localFile = fsa.toUrl(`${outputPath}/downloads/${fileName}`);
      if (await fsa.exists(localFile)) {
        logger.info({ file: file, localFile, fileName }, 'Download:FileExists');
      } else {
        const stats = await fsa.head(file);
        logger.info({ file: file, localFile, fileName, size: stats?.size }, 'Download:Start');
        const stream = fsa.readStream(file);
        await fsa.write(localFile, stream);
        logger.info({ file: file, localFile, fileName }, 'Download:End');
      }
      paths.push(localFile);
    }
  }
  return paths;
}

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

  // Upload to s3 or copy to local
  let path = new URL(`topographic/${CliId}/${filename}`, bucketPath);
  logger.info({ file: file, path: path }, 'Load:Path');
  if (path.protocol === 'file:') await mkdir(dirname(path.pathname), { recursive: true });
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
    defaultValue: () => 'Topographic V2',
    defaultValueIsSerializable: true,
  }),
  target: option({
    type: optional(Url),
    long: 'target',
    description: 'Path of target location to upload the processed file, could be local or s3',
  }),
};

export const JoinCommand = command({
  name: 'join',
  version: CliInfo.version,
  description: 'Join vector mbtiles',
  args: JoinArgs,
  async handler(args) {
    const logger = getLogger(this, args, 'cli-vector');
    const outputPath = path.resolve('tmp/join/');
    await mkdir(outputPath, { recursive: true });
    const tileMatrix = TileMatrixSets.find(args.tileMatrix);
    if (tileMatrix == null) throw new Error(`Tile matrix ${args.tileMatrix} is not supported`);
    const bucketPath = new URL(`vector/${tileMatrix.projection.code}/`, args.target ?? outputPath);
    const filePaths = await download(args.fromFile, outputPath, logger);

    const outputMbtiles = path.join(outputPath, `${args.filename}.mbtiles`);
    logger.info({ files: filePaths.length, outputMbtiles }, 'JoinMbtiles: Start');
    await tileJoin(filePaths, outputMbtiles, logger);
    logger.info({ files: filePaths.length, outputMbtiles }, 'JoinMbtiles: End');

    const outputCotar = path.join(outputPath, `${args.filename}.tar.co`);
    logger.info({ mbtiles: outputMbtiles, outputCotar }, 'ToTartTiles: Start');
    await toTarTiles(outputMbtiles, outputCotar, logger);
    logger.info({ mbtiles: outputMbtiles, outputCotar }, 'ToTartTiles: End');

    const outputIndex = path.join(outputPath, `${args.filename}.tar.index`);
    logger.info({ cotar: outputCotar, outputIndex }, 'toTarIndex: Start');
    await toTarIndex(outputCotar, outputIndex, logger);
    logger.info({ cotar: outputCotar, outputIndex }, 'toTarIndex: End');

    logger.info({ target: bucketPath, tileMatrix: tileMatrix.identifier }, 'CreateStac: Start');
    const stacFiles = await createStacFiles(args.fromFile, bucketPath, args.filename, tileMatrix, args.title, logger);
    logger.info({ cotar: outputCotar, outputIndex }, 'CreateStac: End');

    // Upload output to s3
    logger.info({ target: bucketPath, tileMatrix: tileMatrix.identifier }, 'Upload: Start');
    if (args.target) {
      await upload(fsa.toUrl(outputMbtiles), bucketPath, logger);
      await upload(fsa.toUrl(outputCotar), bucketPath, logger);
      await upload(fsa.toUrl(outputIndex), bucketPath, logger);
      // Upload stac Files
      for (const file of stacFiles) {
        await upload(file, bucketPath, logger);
      }
      logger.info({ target: bucketPath, tileMatrix: tileMatrix.identifier }, 'Upload: End');
    }

    // Write output target for argo tasks to create pull request
    if (isArgo()) {
      const target = new URL(`topographic/${CliId}/${args.filename}.tar.co`, bucketPath);
      await fsa.write(fsa.toUrl('/tmp/target'), urlToString(target));
    }
  },
});
