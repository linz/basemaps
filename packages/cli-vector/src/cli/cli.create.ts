import { fsa, LogType, Url } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { command, flag, option, optional, restPositionals } from 'cmd-ts';
import { createGunzip } from 'zlib';

import { generalize } from '../generalization/generalization.js';
import { Metrics } from '../schema-loader/schema.js';
import { VectorStacItem } from '../stac.js';
import { ogr2ogrNDJson } from '../transform/ogr2ogr.js';
import { tippecanoe } from '../transform/tippecanoe.js';

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
  // TODO: new parapmeter to join multiple mbtiles for local test only, because tile-join is not access to aws.
  // join: flag({
  //   long: 'join',
  //   defaultValue: false,
  //   description: 'Path to JSON file containing array of paths to mbtiles stac json.',
  // }),
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

    logger.info({ files: paths.length }, 'CreateMbtiles: Start');
    const promises = paths.map((path) => createMbtiles(path, logger));
    const metrics = await Promise.all(promises);
    logger.info({ processed: metrics.length }, 'CreateMbtiles: Done');
  },
});

async function createMbtiles(path: URL, logger: LogType): Promise<Metrics> {
  logger.info({ path: path.href }, 'CreateMbtiles: Start');
  const metrics: Metrics = { input: 0, output: 0 };

  // Read the stac file and get mbtiles creation options
  const stac = await fsa.readJson<VectorStacItem>(path);
  if (stac == null) throw new Error(`Failed to read stac file from ${path.href}`);
  const options = stac.properties['linz_basemaps:options'];
  if (options == null) throw new Error(`Failed to read vector creation options from stac ${path.href}`);
  const layer = options.layer;
  const name = options.name;
  const cache = layer.cache;
  if (cache == null) throw new Error(`Failed to read cache path from stac ${path.href}`);
  logger.info({ name, layer: layer.name }, 'CreateMbtiles: Layer');

  // download latest source file
  logger.info({ name, layer: layer.name, source: layer.source }, 'CreateMbtiles: Download');
  const format = layer.source.split('.').pop();
  if (format == null) throw new Error(`Failed to parse source file format ${layer.source}`);
  const contentType = sourceFormats[format];
  if (contentType == null) throw new Error(`Unsupported source file format ${layer.source}`);
  const sourceFile = new URL(`${layer.id}.${format}`, tmpPath);

  const sourceFileExists = await fsa.exists(sourceFile);
  if (!sourceFileExists) {
    const stream = fsa.readStream(new URL(layer.source));
    await fsa.write(sourceFile, stream.pipe(createGunzip()), {
      contentType,
    });
  }

  // Transform the source file to ndjson for generalization
  logger.info({ name, layer: layer.name, source: sourceFile.href }, 'CreateMbtiles: ToNdjson');
  const ndjsonFile = new URL(`${layer.id}.ndjson`, tmpPath);

  const ndjsonFileExists = await fsa.exists(ndjsonFile);
  if (!ndjsonFileExists) {
    await ogr2ogrNDJson(sourceFile, ndjsonFile, logger);
  }

  // Read the ndjson file and apply the generalization options
  logger.info({ name, layer: layer.name, source: ndjsonFile.href }, 'CreateMbtiles: Generalization');
  const generalizedFile = new URL(`${layer.id}-gen.ndjson`, tmpPath);
  const generalized = await generalize(ndjsonFile, generalizedFile, options, logger);
  if (generalized == null) throw new Error(`Failed to generalize ndjson file ${ndjsonFile.href}`);

  if (true) {
    throw new Error('Short circuit');
  }

  // Transform the generalized ndjson file to mbtiles
  const mbtilesFile = new URL(`${layer.id}.mbtiles`, tmpPath);
  await tippecanoe(generalizedFile, mbtilesFile, layer, logger);

  // Write the mbtiles file to the cache
  logger.info({ name, layer: layer.name, mbtilesFile: mbtilesFile.href }, 'CreateMbtiles: WriteMbtiles');
  const output = new URL(path.href.replace(/\.json$/, '.mbtiles'));
  await fsa.write(output, fsa.readStream(mbtilesFile));
  if (!(await fsa.exists(path))) throw new Error(`Failed to upload the output mbtiles ${output.href}`);
  logger.info({ name, layer: layer.name, mbtilesFile: output.href }, 'CreateMbtiles: UpdateStac');
  stac.properties['linz_basemaps:options']!.layer.cache!.exists = true;
  await fsa.write(path, JSON.stringify(stac, null, 2));
  return metrics;
}
