import { TileMatrixSets } from '@basemaps/geo';
import { fsa, Url } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { command, option, string } from 'cmd-ts';

import { createStacFiles } from '../stac.js';
import { toTarIndex } from '../transform/covt.js';
import { toTarTiles } from '../transform/mbtiles.to.ttiles.js';
import { tileJoin } from '../transform/tippecanoe.js';

async function fromFile(path: URL): Promise<URL[]> {
  const toProcess = await fsa.readJson(path);
  const paths: URL[] = [];
  if (!Array.isArray(toProcess)) throw new Error(`File ${path.href} is not an array`);
  for (const tasks of toProcess) {
    if (Array.isArray(tasks)) {
      for (const task of tasks) {
        if (typeof task !== 'string') throw new Error(`File ${path.href} is not an array of strings`);
        paths.push(new URL(task));
      }
    } else if (typeof tasks === 'string') {
      paths.push(new URL(tasks));
    } else {
      throw new Error(`File ${path.href} is not an array of strings`);
    }
  }
  return paths;
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
    defaultValue: () => 'topographic',
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

    await toTarIndex(outputCotar, 'tmp/', args.filename, logger);

    const tileMatrix = TileMatrixSets.find(args.tileMatrix);
    if (tileMatrix == null) throw new Error(`Tile matrix ${args.tileMatrix} is not supported`);
    await createStacFiles(filePaths, args.target, args.filename, tileMatrix, args.title, logger);
  },
});
