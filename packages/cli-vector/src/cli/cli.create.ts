import { fsa, LogType, Url } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { command, flag, number, option, optional, restPositionals } from 'cmd-ts';
import PLimit from 'p-limit';
import { createGunzip } from 'zlib';

import { generalize } from '../generalization/generalization.js';
import { Metrics } from '../schema-loader/schema.js';
import { VectorStacItem } from '../stac.js';
import { ogr2ogrNDJson } from '../transform/ogr2ogr.js';
import { tileJoin, tippecanoe } from '../transform/tippecanoe.js';
import { prepareTmpPaths } from '../util.js';

const tmpPath = fsa.toUrl('tmp/create/');

const sourceFormats: { [key: string]: string } = {
  gpkg: 'application/x-ogc-gpkg',
  shp: 'application/x-ogc-shp',
  geojson: 'application/geo+json',
};

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

    logger.info({ files: paths.length }, 'Create All Mbtiles: Start');
    const q = PLimit(args.concurrency);
    const promises = paths.map((path) => q(() => createMbtiles(path, logger)));
    const metrics = await Promise.all(promises);
    logger.info({ processed: metrics.length }, 'Create All Mbtiles: End');

    if (args.join === true) {
      const mbtileFiles = metrics.flatMap((metrics) => metrics.mbTilesPath?.pathname ?? []);
      logger.info({ joining: mbtileFiles.length }, 'JoinMbtiles:Start');

      const joinedFile = new URL(`joined.mbtiles`, tmpPath);

      await tileJoin(mbtileFiles, joinedFile.pathname, logger);
      if (!(await fsa.exists(joinedFile))) throw new Error(`Failed to create joined mbtiles ${joinedFile.href}`);
      logger.info({ output: joinedFile.href }, 'JoinMbtiles:End');
    }
  },
});

async function createMbtiles(path: URL, logger: LogType): Promise<Metrics> {
  logger.info({ path: path.href }, 'CreateMbtiles: Start');

  /**
   * Parse the Vector Stac Item file
   */
  logger.info({ path: path.href }, 'CreateMbtiles: Parse Vector Stac Item');
  const stac = await fsa.readJson<VectorStacItem>(path);
  if (stac == null) throw new Error(`Failed to read stac file from ${path.href}`);

  // mbtiles creation options
  const options = stac.properties['linz_basemaps:options'];
  if (options == null) throw new Error(`Failed to read vector creation options from stac ${path.href}`);

  const layer = options.layer;
  const shortbreadLayer = options.name;
  if (shortbreadLayer == null) throw new Error(`Failed to read Shortbread layer name from stac ${path.href}`);

  const cache = layer.cache;
  if (cache == null) throw new Error(`Failed to read cache path from stac ${path.href}`);
  logger.info({ shortbreadLayer, layer: layer.name }, 'CreateMbtiles: Layer');

  const format = layer.source.split('.').pop();
  if (format == null) throw new Error(`Failed to parse source file format ${layer.source}`);

  const contentType = sourceFormats[format];
  if (contentType == null) throw new Error(`Unsupported source file format ${layer.source}`);

  /**
   * Prepare tmp paths for local files
   */
  const paths = prepareTmpPaths(tmpPath, path, layer.id, format, shortbreadLayer);

  /**
   * Download the source file
   */
  logger.info({ source: layer.source }, 'CreateMbtiles: DownloadSource');
  if (!(await fsa.exists(paths.source))) {
    const stream = fsa.readStream(new URL(layer.source));
    await fsa.write(paths.source, stream.pipe(createGunzip()), {
      contentType,
    });
  }

  /**
   * Convert the source file into an ndjson
   */
  logger.info({ source: paths.source.href }, 'CreateMbtiles: ToNdjson');
  if (!(await fsa.exists(paths.ndjson))) {
    await ogr2ogrNDJson(paths.source, paths.ndjson, logger);
  }

  /**
   * Parse the ndjson file and apply the generalization options
   */
  logger.info({ source: paths.ndjson.href }, 'CreateMbtiles: doGeneralize');
  if (!(await fsa.exists(paths.genNdjson))) {
    const metrics = await generalize(paths.ndjson, paths.genNdjson, options, logger);

    if (metrics.output === 0) throw new Error(`Failed to generalize ndjson file ${paths.ndjson.href}`);
    layer.metrics = metrics;
  }

  /**
   * Transform the generalized ndjson file to an mbtiles file
   */
  logger.info({ source: paths.genNdjson.href }, 'CreateMbtiles: ToMbtiles');
  if (!(await fsa.exists(paths.mbtiles))) {
    await tippecanoe(paths.genNdjson, paths.mbtiles, layer, logger);
  }

  /**
   * Copy the mbtiles file to the same directory as the Vector Stac Item file
   */
  logger.info({ source: paths.mbtiles.href }, 'CreateMbtiles: WriteMbtiles');
  const mbTilesFileCopy = new URL(path.href.replace(/\.json$/, '.mbtiles'));

  if (!(await fsa.exists(paths.mbtilesCopy))) {
    await fsa.write(mbTilesFileCopy, fsa.readStream(paths.mbtiles));

    // Ensure the mbtiles file was copied successfully
    if (!(await fsa.exists(paths.mbtilesCopy))) {
      throw new Error(`Failed to write the mbtiles file to ${mbTilesFileCopy.href}`);
    }
  }

  /**
   * Update the Vector Stac Item file
   */
  logger.info({ stac: path.href }, 'CreateMbtiles: UpdateStac');

  // Update 'cache' flag to 'true' now that the mbtiles file exists
  stac.properties['linz_basemaps:options']!.layer.cache!.exists = true;

  // Assign the 'lds:feature_count' property
  const layerLinkIndex = stac.links.findIndex((stacLink) => stacLink.rel === 'lds:layer');
  if (layerLinkIndex === -1) throw new Error('Failed to locate `lds:layer` link object');

  if (stac.links[layerLinkIndex]['lds:feature_count'] == null) {
    const metrics = layer.metrics;
    if (metrics == null) throw new Error('Metrics object does not exist');

    stac.links[layerLinkIndex]['lds:feature_count'] = metrics.input;
  }

  // Overwrite the vector stac item
  await fsa.write(path, JSON.stringify(stac, null, 2));

  /**
   * Return metrics
   */
  return { mbTilesPath: paths.mbtiles, input: layer.metrics?.input ?? -1, output: layer.metrics?.input ?? -1 };
}
