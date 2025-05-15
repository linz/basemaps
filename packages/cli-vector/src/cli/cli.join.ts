import { Epsg, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogType, Url } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { command, option, string } from 'cmd-ts';
import { basename } from 'path';
import { createGzip } from 'zlib';

import { createStacFiles } from '../stac.js';
import { toTarIndex } from '../transform/covt.js';
import { toTarTiles } from '../transform/mbtiles.to.ttiles.js';
import { tileJoin } from '../transform/tippecanoe.js';

async function fromFile(path: URL): Promise<URL[]> {
  const toProcess = await fsa.readJson(path);
  const paths: URL[] = [];
  if (!Array.isArray(toProcess)) throw new Error(`File ${path.href} is not an array`);
  for (const task of toProcess) {
    if (typeof task !== 'string') throw new Error(`File ${path.href} is not an array of strings`);
    const sourceFile = new URL(task);
    if (sourceFile.protocol === 'file:') {
      paths.push(sourceFile);
    } else {
      const fileName = basename(sourceFile.pathname);
      if (fileName == null) throw new Error(`Unsupported source pathname ${sourceFile.pathname}`);
      const localFile = new URL(fileName, fsa.toUrl('tmp/join/'));
      const stream = fsa.readStream(sourceFile);
      await fsa.write(localFile, stream);
      paths.push(localFile);
    }
  }
  return paths;
}

/**
 * Upload output file into s3 bucket
 *
 */
async function upload(file: URL, bucketPath: string, logger: LogType): Promise<URL> {
  logger.info({ file: file }, 'Load:Start');
  let filename = basename(file.pathname);
  let stream = fsa.readStream(file);

  // gzip index file
  if (filename.endsWith('index')) {
    filename = `${filename}.gz`;
    stream = stream.pipe(createGzip());
  }

  // Upload to s3
  let path = fsa.toUrl(`${bucketPath}/${CliId}/${filename}`);
  if (filename.endsWith('catalog.json')) path = fsa.toUrl(`${bucketPath}/${filename}`); // Upload catalog to root directory
  await fsa.write(path, stream);
  logger.info({ file: file, path: path }, 'Load:Finish');
  return path;
}

export const JoinArgs = {
  ...logArguments,
  fromFile: option({
    type: Url,
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
    const filePaths = await fromFile(args.fromFile);

    logger.info({ files: filePaths.length }, 'JoinMbtiles: Start');

    const outputMbtiles = fsa.toUrl(`tmp/${args.filename}.mbtiles`);

    await tileJoin(filePaths, outputMbtiles, logger);

    const outputCotar = fsa.toUrl(`tmp/${args.filename}.covt`);

    await toTarTiles(outputMbtiles, outputCotar, logger);

    const [outputIndex, outputTar] = await toTarIndex(outputCotar, 'tmp/', args.filename, logger);

    const tileMatrix = TileMatrixSets.find(args.tileMatrix);
    if (tileMatrix == null) throw new Error(`Tile matrix ${args.tileMatrix} is not supported`);
    const stacFiles = await createStacFiles(filePaths, args.target, args.filename, tileMatrix, args.title, logger);

    // Upload output to s3
    const bucketPath = `${args.target}/vector/${Epsg.Google.code.toString()}/${args.filename}`;
    await upload(outputMbtiles, bucketPath, logger);
    await upload(fsa.toUrl(outputTar), bucketPath, logger);
    await upload(fsa.toUrl(outputIndex), bucketPath, logger);
    // Upload stac Files
    for (const file of stacFiles) {
      await upload(file, bucketPath, logger);
    }
  },
});
