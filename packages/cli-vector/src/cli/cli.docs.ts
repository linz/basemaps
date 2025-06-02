import { fsa, Url, UrlFolder } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { command, option } from 'cmd-ts';
import { readFileSync } from 'fs';
import Mustache from 'mustache';
import { z } from 'zod';

import { zSchema } from '../schema-loader/parser.js';
import { Schema } from '../schema-loader/schema.js';

interface Property {
  name: string;
  type: string;
  description: string;
}

interface Feature {
  name: string;
  kind: string;
  geometry: string;
  minZoom: number;
  maxZoom: number;
}

interface Layer {
  name: string;
  description: string;
  properties: Property[];
  features: Feature[];
}

function pathToURLFolder(path: string): URL {
  const url = fsa.toUrl(path);
  url.search = '';
  url.hash = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}

export const DocsArgs = {
  ...logArguments,
  schema: option({
    type: UrlFolder,
    long: 'schema',
    defaultValue: () => pathToURLFolder('schema'),
    description: 'Path to the directory containing the schema files from which to generate markdown docs',
  }),
  template: option({
    type: Url,
    long: 'template',
    description: 'Template file',
  }),
  target: option({
    type: Url,
    long: 'target',
    description: 'Target location for the result file',
  }),
};

export const DocsCommand = command({
  name: 'docs',
  version: CliInfo.version,
  description: 'Generate markdown docs from a directory of schema files.',
  args: DocsArgs,
  async handler(args) {
    const logger = getLogger(this, args, 'cli-vector');
    logger.info('GenerateMarkdownDocs: Start');

    // parse schema files
    const schemas: Schema[] = [];
    const files = await fsa.toArray(fsa.list(args.schema));

    for (const file of files) {
      if (file.href.endsWith('.json')) {
        const json = await fsa.readJson(file);
        // Validate the json
        try {
          const parsed = zSchema.parse(json);
          schemas.push(parsed);
        } catch (e) {
          if (e instanceof z.ZodError) {
            throw new Error(`Schema ${file.href} is invalid: ${e.message}`);
          }
        }
      }
    }

    const layers: Layer[] = [];

    for (const schema of schemas) {
      const properties = schema.metadata.attributes.map((attribute) => ({
        name: attribute,
        type: 'TBC',
        description: 'TBC',
      }));

      const features = schema.layers.reduce(
        (obj, layer) => {
          const kind = layer.tags['kind'];
          if (typeof kind !== 'string') return obj;

          //   const zoom =
          //     layer.style.minZoom === layer.style.maxZoom
          //       ? layer.style.minZoom.toString()
          //       : `${layer.style.minZoom}-${layer.style.maxZoom}`;

          const entry = obj[kind];

          if (entry == null) {
            return {
              ...obj,
              [kind]: {
                name: kind,
                kind,
                geometry: 'TBC',
                minZoom: layer.style.minZoom,
                maxZoom: layer.style.maxZoom,
              } as Feature,
            };
          }

          if (layer.style.minZoom < entry.minZoom) {
            entry.minZoom = layer.style.minZoom;
          }

          if (layer.style.maxZoom > entry.maxZoom) {
            entry.maxZoom = layer.style.maxZoom;
          }

          return obj;
        },
        {} as { [key: string]: Feature },
      );

      layers.push({
        name: schema.name,
        description: 'TBC',
        properties,
        features: Object.values(features),
      });
    }

    const template = readFileSync(args.template).toString();
    const output = Mustache.render(template, { layers });
    await fsa.write(new URL('result.md', args.target), output);

    logger.info('GenerateMarkdownDocs: End');
  },
});
