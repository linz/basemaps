import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { fsa } from '@chunkd/fs';
import { command, number, option, string } from 'cmd-ts';

import { Layer, SchemaMetadata } from '../schema-loader/schema.js';
import { SchemaLoader } from '../schema-loader/schema.loader.js';

function pathToURLFolder(path: string): URL {
  const url = fsa.toUrl(path);
  url.search = '';
  url.hash = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}

export interface Task {
  name: string;
  metadata: SchemaMetadata;
  layer: Layer;
}

export interface ToProcess {
  tasks: Task[];
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
    const logger = getLogger(this, args);
    const path = pathToURLFolder(args.path);
    const cache = pathToURLFolder(args.cache);

    // Find all lds layers that need to be process
    logger.info({ path }, 'Extract: Start');
    const schemaLoader = new SchemaLoader(new URL(path), logger, cache);
    const schemas = await schemaLoader.load();
    const toProcess: ToProcess[] = [];
    let counter = 0;
    let total = 0;
    let tasks: Task[] = [];
    for (const schema of schemas) {
      for (const layer of schema.layers) {
        if (counter >= args.group) {
          toProcess.push({ tasks: tasks });
          tasks = [];
          counter = 0;
        }

        // Skip if the layer is already processed in cache
        if (layer.cache && (await fsa.exists(layer.cache))) {
          logger.info({ layer: schema.name, id: layer.id, cache: layer.cache }, 'Extract: Exists');
          continue;
        }

        // Prepare task to process
        logger.info({ layer: schema.name, id: layer.id }, 'Extract: ToProcess');
        const task: Task = {
          name: schema.name,
          metadata: schema.metadata,
          layer,
        };

        // Separate large layer as individual task
        if (layer.largeLayer) {
          toProcess.push({ tasks: [task] });
        } else {
          // Group the tasks together
          tasks.push(task);
          counter++;
        }
        total++;
      }
    }

    logger.info({ ToProcess: total }, 'CheckUpdate: Finish');
    await fsa.write(fsa.toUrl('tmp/vector/toProcess.json'), JSON.stringify(toProcess, null, 2));
    await fsa.write(fsa.toUrl('tmp/vector/updateRequired'), String(total > 0));
  },
});
