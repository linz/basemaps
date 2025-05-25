import { fsa, LogType, Url } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { command, flag, number, option, optional, restPositionals } from 'cmd-ts';
import PLimit from 'p-limit';
import { createGunzip } from 'zlib';

import { generalize } from '../generalization/generalization.js';
import { VectorStacItem } from '../stac.js';
import { ogr2ogrNDJson } from '../transform/ogr2ogr.js';
import { tileJoin, tippecanoe } from '../transform/tippecanoe.js';
import { ContentType, prepareTmpPaths, TmpPaths } from '../util.js';

const TmpPath = fsa.toUrl('tmp/create/');

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

export const CreateArgs = {
  ...logArguments,
  path: restPositionals({ type: Url, displayName: 'path', description: 'Path to vector Stac Item' }),
  fromFile: option({
    type: optional(Url),
    long: 'from-file',
    description: 'Path to JSON file containing array of paths to mbtiles stac json.',
  }),
  concurrency: option({
    type: number,
    long: 'concurrency',
    defaultValue: () => 1,
    defaultValueIsSerializable: true,
  }),
  join: flag({
    long: 'join',
    description:
      'TODO: new parameter to join multiple mbtiles for local test only, because tile-join is not access to aws',
    defaultValue: () => false,
    defaultValueIsSerializable: true,
  }),
};

export const CreateCommand = command({
  name: 'create',
  version: CliInfo.version,
  description: 'Create individual vector mbtiles.',
  args: CreateArgs,
  async handler(args) {
    const logger = getLogger(this, args, 'cli-vector');
    const paths = args.path;
    if (args.fromFile != null) {
      const filePaths = await fromFile(args.fromFile);
      paths.push(...filePaths);
    }

    // parse files as vector stac items and prepare tmp file paths
    logger.info({ files: paths.length }, 'Parse Vector Stac Items: Start');
    const items = await Promise.all(paths.map((path) => prepareItem(path, logger)));
    logger.info({ items: items.length }, 'Parse Vector Stac Items: End');

    const q = PLimit(args.concurrency);

    // download source files
    logger.info({ items: items.length }, 'Download Source Files: Start');
    await Promise.all(items.map((item) => q(() => downloadSourceFile(item, logger))));
    logger.info({ items: items.length }, 'Download Source Files: End');

    // generate ndjsons and mbtiles
    logger.info({ items: items.length }, 'Create Mbtiles Files: Start');
    await Promise.all(items.map((item) => q(() => createMbtilesFile(item, logger))));
    logger.info({ items: items.length }, 'Create Mbtiles Files: End');

    // if applicable, combine all mbtiles files into a single mbtiles file
    if (args.join === true) {
      const mbtileFiles = items.map((item) => item.tmpPaths.mbtiles.pathname);
      logger.info({ joining: mbtileFiles.length }, 'JoinMbtiles:Start');

      const joinedFile = new URL(`joined.mbtiles`, TmpPath);

      await tileJoin(mbtileFiles, joinedFile.pathname, logger);
      if (!(await fsa.exists(joinedFile))) throw new Error(`Failed to create joined mbtiles ${joinedFile.href}`);
      logger.info({ output: joinedFile.href }, 'JoinMbtiles:End');
    }
  },
});

/**
 * Parses the given filepath into a runtime VectorStacItem object and prepares temporary paths for upcoming local files.
 *
 * @param path - the path to the file to parse
 * @param logger - a logger instance
 * @returns an object containing a VectorStacItem and TmpPaths object
 */
async function prepareItem(
  path: URL,
  logger: LogType,
): Promise<{
  stac: VectorStacItem;
  tmpPaths: TmpPaths;
}> {
  logger.info({ source: path }, 'PrepareItem: Start');
  // parse Vector Stac Item file
  const stac = await fsa.readJson<VectorStacItem>(path);
  const options = stac.properties['linz_basemaps:options'];
  const layer = options.layer;
  const shortbreadLayer = options.name;

  // check properties
  const cache = layer.cache;
  if (cache == null) throw new Error(`Failed to read cache path from stac ${path.href}`);

  const format = layer.source.split('.').pop();
  if (format == null) throw new Error(`Failed to parse source file format ${layer.source}`);
  if (!(format in ContentType)) throw new Error(`Unsupported source file format ${layer.source}`);

  // prepare tmp paths for local files
  const tmpPaths = prepareTmpPaths(TmpPath, path, layer.id, format as keyof typeof ContentType, shortbreadLayer);

  logger.info({ shortbreadLayer, dataset: layer.name }, 'PrepareItem: End');
  return { stac, tmpPaths };
}

/**
 * Downloads the given VectorStacItem's source file locally.
 *
 * @param stac - the VectorStacItem object for which to download its source file
 * @param tmpPaths - the TmpPaths object denoting where to save the downloaded file
 * @param logger - a logger instance
 */
async function downloadSourceFile(
  { stac, tmpPaths }: { stac: VectorStacItem; tmpPaths: TmpPaths },
  logger: LogType,
): Promise<void> {
  const options = stac.properties['linz_basemaps:options'];
  const layer = options.layer;

  logger.info({ source: layer.source }, 'DownloadSourceFile: Start');

  if (!(await fsa.exists(tmpPaths.source.path))) {
    const stream = fsa.readStream(new URL(layer.source));
    await fsa.write(tmpPaths.source.path, stream.pipe(createGunzip()), {
      contentType: tmpPaths.source.contentType,
    });
  }

  logger.info({ destination: tmpPaths.source.path }, 'DownloadSourceFile: End');
}

/**
 * Generates an Mbtiles file from the given VectorStacItem's source file. Steps:
 *
 * 1. Converts the source file into an ndjson
 * 2. Parses the ndjson file and applies the generalization options
 * 3. Transforms the generalized ndjson file to an mbtiles file
 * 4. Copies the mbtiles file to the same directory as the Vector Stac Item file
 * 5. Updates the Vector Stac Item file
 *
 * @param stac - the VectorStacItem object from which to generate an Mbtiles file
 * @param tmpPaths - the TmpPaths object denoting where to save temporary files for each step
 * @param logger - a logger instance
 */
async function createMbtilesFile(
  { stac, tmpPaths }: { stac: VectorStacItem; tmpPaths: TmpPaths },
  logger: LogType,
): Promise<void> {
  const options = stac.properties['linz_basemaps:options'];
  const layer = options.layer;
  const shortbreadLayer = options.name;

  logger.info({ shortbreadLayer, dataset: layer.name }, 'CreateMbtilesFile: Start');

  /**
   * Convert the source file into an ndjson
   */
  logger.info({ source: tmpPaths.source.path }, '[1/5] Convert source file to ndjson: Start');
  if (!(await fsa.exists(tmpPaths.ndjson))) {
    await ogr2ogrNDJson(tmpPaths.source.path, tmpPaths.ndjson, logger);
  }
  logger.info({ destination: tmpPaths.ndjson }, '[1/5] Convert source file to ndjson: End');

  /**
   * Parse the ndjson file and apply the generalization options
   */
  logger.info({ source: tmpPaths.ndjson }, '[2/5] Generalise ndjson features: Start');
  if (!(await fsa.exists(tmpPaths.genNdjson))) {
    const metrics = await generalize(tmpPaths.ndjson, tmpPaths.genNdjson, options, logger);
    if (metrics.output === 0) throw new Error(`Failed to generalize ndjson file ${tmpPaths.ndjson.href}`);
    layer.metrics = metrics;
  }
  logger.info({ destination: tmpPaths.genNdjson }, '[2/5] Generalise ndjson features: End');

  /**
   * Transform the generalized ndjson file to an mbtiles file
   */
  logger.info({ source: tmpPaths.genNdjson }, '[3/5] Transform generalised ndjson into mbtiles: Start');
  if (!(await fsa.exists(tmpPaths.mbtiles))) {
    await tippecanoe(tmpPaths.genNdjson, tmpPaths.mbtiles, layer, logger);
  }
  logger.info({ destination: tmpPaths.mbtiles }, '[3/5] Transform generalised ndjson into mbtiles: End');

  /**
   * Copy the mbtiles file to the same directory as the Vector Stac Item file
   */
  logger.info({ source: tmpPaths.mbtiles }, '[4/5] Copy mbtiles to stac location: Start');
  if (!(await fsa.exists(tmpPaths.mbtilesCopy))) {
    await fsa.write(tmpPaths.mbtilesCopy, fsa.readStream(tmpPaths.mbtiles));

    // Ensure the mbtiles file was copied successfully
    if (!(await fsa.exists(tmpPaths.mbtilesCopy))) {
      throw new Error(`Failed to write the mbtiles file to ${tmpPaths.mbtilesCopy.href}`);
    }
  }
  logger.info({ destination: tmpPaths.mbtilesCopy }, '[4/5] Copy mbtiles to stac location: End');

  /**
   * Update the Vector Stac Item file
   */
  logger.info({ source: tmpPaths.origin }, '[5/5] Update stac: Start');

  // Update 'cache' flag to 'true' now that the mbtiles file exists
  layer.cache!.exists = true;

  // Assign the 'lds:feature_count' property
  const links = stac.links;
  const ldsLayerIndex = links.findIndex((stacLink) => stacLink.rel === 'lds:layer');
  if (ldsLayerIndex === -1) throw new Error('Failed to locate `lds:layer` link object');

  if (links[ldsLayerIndex]['lds:feature_count'] == null) {
    const metrics = layer.metrics;
    if (metrics == null) throw new Error('Metrics object does not exist');

    links[ldsLayerIndex]['lds:feature_count'] = metrics.input;
  }

  // Overwrite the Vector Stac Item file
  await fsa.write(tmpPaths.origin, JSON.stringify(stac, null, 2));
  logger.info({ destination: tmpPaths.origin }, '[5/5] Update stac: End');
}
