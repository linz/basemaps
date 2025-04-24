import { TileMatrixSets } from '@basemaps/geo';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { fsa } from '@chunkd/fs';
import { command, number, option, string } from 'cmd-ts';

import { SchemaLoader } from '../schema-loader/schema.loader.js';
import { VectorCreationOptions, VectorStac } from '../stac.js';

function pathToURLFolder(path: string): URL {
  const url = fsa.toUrl(path);
  url.search = '';
  url.hash = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}

export interface ToProcess {
  tasks: string[];
}

export const ExtractArgs = {
  ...logArguments,
  path: option({
    type: string,
    long: 'path',
    defaultValue: () => './schema/',
    defaultValueIsSerializable: true,
    description: 'Path of Tiles schema json files that define the source layer and schemas',
  }),
  cache: option({
    type: string,
    long: 'cache',
    description: 'Path of cache location, could be local or s3',
  }),
  tileMatrix: option({
    type: string,
    long: 'tile-matrix',
    description: `Output TileMatrix to use WebMercatorQuad or NZTM2000Quad`,
    defaultValue: () => 'WebMercatorQuad',
    defaultValueIsSerializable: true,
  }),
  group: option({
    type: number,
    long: 'group',
    defaultValue: () => 100,
    defaultValueIsSerializable: true,
    description: 'Number of layers grouped together, default to 100',
  }),
};

export const ExtractCommand = command({
  name: 'extract',
  version: CliInfo.version,
  description: 'Validation for the Vector ETL to check for updates.',
  args: ExtractArgs,
  async handler(args) {
    const logger = getLogger(this, args, 'cli-vector');
    const path = pathToURLFolder(args.path);
    const cache = pathToURLFolder(args.cache);
    const tileMatrix = TileMatrixSets.find(args.tileMatrix);
    if (tileMatrix == null) throw new Error(`Tile matrix ${args.tileMatrix} is not supported`);

    // Find all lds layers that need to be process
    logger.info({ path }, 'Extract: Start');
    const schemaLoader = new SchemaLoader(new URL(path), logger, cache);
    const schemas = await schemaLoader.load();
    const toProcess: ToProcess[] = [];
    let total = 0;
    let tasks: string[] = [];
    const allFiles: string[] = [];
    const vectorStac = new VectorStac(logger);
    for (const schema of schemas) {
      for (const layer of schema.layers) {
        if (layer.cache == null) throw new Error(`Fail to prepare cache path for layer ${schema.name}:${layer.id}`);
        allFiles.push(layer.cache.path.href);
        if (tasks.length >= args.group) {
          toProcess.push({ tasks });
          tasks = [];
        }

        // Skip if the layer is already processed in cache
        if (layer.cache.exists) {
          logger.info({ layer: schema.name, id: layer.id, cache: layer.cache }, 'Extract: Exists');
          continue;
        }

        // Create stac file for the cache mbtiles
        logger.info({ layer: schema.name, id: layer.id }, 'Extract: StacItem');
        const stacFile = new URL(layer.cache.path.href.replace(/\.mbtiles$/, '.json'));
        const stacLink = await vectorStac.createStacLink(schema.name, layer);
        const options: VectorCreationOptions = {
          name: schema.name,
          metadata: schema.metadata,
          tileMatrix: tileMatrix.identifier,
          layer,
        };
        const stacItem = vectorStac.createStacItem([stacLink], layer.cache.fileName, tileMatrix, options);
        await fsa.write(stacFile, JSON.stringify(stacItem, null, 2));

        // Prepare task to process
        logger.info({ layer: schema.name, id: layer.id }, 'Extract: ToProcess');

        // Separate large layer as individual task
        if (layer.largeLayer) {
          toProcess.push({ tasks: [stacFile.href] });
        } else {
          // Group the tasks together
          tasks.push(stacFile.href);
        }
        total++;
      }
    }
    // Push remaining tasks
    toProcess.push({ tasks });

    logger.info({ ToProcess: total }, 'CheckUpdate: Finish');
    await fsa.write(fsa.toUrl('tmp/vector/allFiles.json'), JSON.stringify(allFiles, null, 2));
    await fsa.write(fsa.toUrl('tmp/vector/toProcess.json'), JSON.stringify(toProcess, null, 2));
    await fsa.write(fsa.toUrl('tmp/vector/updateRequired'), String(total > 0));
  },
});
