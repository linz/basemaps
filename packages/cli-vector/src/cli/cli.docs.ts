import { fsa, Url, UrlFolder } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { command, option } from 'cmd-ts';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import Mustache from 'mustache';
import { z } from 'zod';

import { zSchema } from '../schema-loader/parser.js';
import { Schema } from '../schema-loader/schema.js';
import { AttributeDoc, FeaturesDoc, LayerDoc } from '../types/doc.js';
import { AttributeReport, LayerReport, zLayerReport } from '../types/report.js';

export const DocsArgs = {
  ...logArguments,
  schemas: option({
    type: UrlFolder,
    long: 'schemas',
    description: 'Path to the directory containing schemas from which to extract layer-specific information.',
  }),
  reports: option({
    type: UrlFolder,
    long: 'reports',
    description:
      'Path to the directory containing reports from which to extract layer, feature, and attribute information.',
  }),
  template: option({
    type: Url,
    long: 'template',
    description: 'Path to the Mustache template markdown file.',
  }),
  target: option({
    type: UrlFolder,
    long: 'target',
    description: 'Target directory into which to save the generated markdown documentation.',
  }),
};

export const DocsCommand = command({
  name: 'docs',
  version: CliInfo.version,
  description:
    'Parses a directory of JSON report files and a Mustache template file to generate a collection of vector tile schema markdown files.',
  args: DocsArgs,
  async handler(args) {
    const logger = getLogger(this, args, 'cli-vector');
    logger.info('Generate Markdown Docs: Start');

    const targetExists = existsSync(args.target);
    if (!targetExists) mkdirSync(args.target, { recursive: true });

    // parse schema files
    const schemas: Schema[] = [];
    const schemaFiles = await fsa.toArray(fsa.list(args.schemas));

    for (const file of schemaFiles) {
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

    // parse report files
    const reports: LayerReport[] = [];
    const reportFiles = await fsa.toArray(fsa.list(args.reports));

    for (const file of reportFiles) {
      if (file.href.endsWith('.json')) {
        const json = await fsa.readJson(file);
        // Validate the json
        try {
          const parsed = zLayerReport.parse(json);
          reports.push(parsed);
        } catch (e) {
          if (e instanceof z.ZodError) {
            throw new Error(`Report ${file.href} is invalid: ${e.message}`);
          }
        }
      }
    }

    const docs: LayerDoc[] = [];

    for (const report of reports) {
      const schema = schemas.find((schema) => schema.name === report.name);
      if (schema == null) throw new Error(`Could not locate schema to pair with report: ${report.name}`);

      const attributes = flattenAttributes(report.all.attributes);
      const zoom_levels = flattenZoomLevels(report.all.zoom_levels);

      const all: FeaturesDoc = {
        name: 'all',
        filter: '["all"]',
        attributes,
        hasAttributes: attributes.length > 0,
        geometries: report.all.geometries.join(', '),
        zoom_levels,
      };

      if (report.kinds == null) {
        docs.push({
          name: report.name,
          description: schema.description,
          isCustom: schema.custom ?? false,
          all,
        });
        continue;
      }

      const kinds: FeaturesDoc[] = [];

      for (const [name, kind] of Object.entries(report.kinds)) {
        const attributes = flattenAttributes(kind.attributes);
        const zoom_levels = flattenZoomLevels(kind.zoom_levels);

        kinds.push({
          name,
          filter: `["all", ["==", "kind", "${name}"]]`,
          attributes,
          hasAttributes: attributes.length > 0,
          geometries: kind.geometries.join(', '),
          zoom_levels,
        });
      }

      kinds.sort((a, b) => a.name.localeCompare(b.name));

      docs.push({
        name: report.name,
        description: schema.description,
        isCustom: schema.custom ?? false,
        all,
        kinds,
      });
    }

    const template = readFileSync(args.template).toString();

    for (const layer of docs) {
      const markdown = Mustache.render(template, layer);
      const url = new URL(`${layer.name}.md`, args.target);

      await fsa.write(url, markdown);
      logger.info({ url }, 'File created');
    }

    logger.info('Generate Markdown Docs: End');
  },
});

function flattenAttributes(attributes: Record<string, AttributeReport>): AttributeDoc[] {
  const attributeDocs: AttributeDoc[] = [];

  for (const [name, attribute] of Object.entries(attributes)) {
    // flatten types
    const types = attribute.types.join(', ');

    // flatten values
    const values: string[] = [];

    if (!attribute.guaranteed) {
      values.push('<code>{empty}</code>');
    }

    if (attribute.has_more_values === true) {
      values.push(`<i>Too many values to list</i>`);
    } else {
      values.push(...attribute.values.sort().map(String));
    }

    // push attribute
    attributeDocs.push({ name, types, values: values.join(', ') });
  }

  return attributeDocs.toSorted((a, b) => a.name.localeCompare(b.name));
}

function flattenZoomLevels(zoom_levels: number[]): { min: number; max: number } {
  const min = Math.min(...zoom_levels);
  const max = Math.max(...zoom_levels);

  return { min, max };
}
