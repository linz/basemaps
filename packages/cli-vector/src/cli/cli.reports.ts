import { DatabaseSync } from 'node:sqlite';

import { Url, UrlFolder } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { VectorTile, VectorTileFeature } from '@mapbox/vector-tile';
import { command, oneOf, option } from 'cmd-ts';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import Protobuf from 'pbf';
import { gunzipSync } from 'zlib';

import { Report } from '../schema-loader/schema.js';

export const MaxValues = 24;
const MaxZoom = 15;

export const ReportsArgs = {
  ...logArguments,
  mbtiles: option({
    type: Url,
    long: 'mbtiles',
    description: 'Path to the mbtiles from which to generate reports.',
  }),
  target: option({
    type: UrlFolder,
    long: 'target',
    description: 'Target directory into which to save the generated reports.',
  }),
  mode: option({
    type: oneOf(['none', 'limited', 'full']),
    defaultValue: () => 'limited',
    defaultValueIsSerializable: true,
    long: 'mode',
    description:
      'For each attribute: ' +
      'none - do not output any values (fast). ' +
      `limited - only output the first ${MaxValues} unique values. ` +
      'full - output all unique values (slow).',
  }),
};

export const ReportsCommand = command({
  name: 'reports',
  version: CliInfo.version,
  description:
    'Parses an MBTiles file to extract and report detailed information about its contents. ' +
    'Identifies the layers, features within those layers, and attributes for each feature.',
  args: ReportsArgs,
  handler(args) {
    const logger = getLogger(this, args, 'cli-vector');
    logger.info('Reports: Start');

    const targetExists = existsSync(args.target);
    if (!targetExists) mkdirSync(args.target, { recursive: true });

    const layerReports: Record<string, Report> = {};

    const db = new DatabaseSync(args.mbtiles);
    for (let zoomLevel = 0; zoomLevel <= MaxZoom; zoomLevel++) {
      logger.info({ zoomLevel }, 'Start');

      const rows = db
        .prepare(
          'SELECT tile_column AS x, tile_row AS y, zoom_level AS z, tile_data AS data ' +
            'FROM tiles ' +
            'WHERE zoom_level = ?',
        )
        .all(zoomLevel) as { x: number; y: number; z: number; data: Buffer }[];

      for (const row of rows) {
        logger.info({ x: row.x, y: row.y, z: row.z }, 'Start');

        const buffer = gunzipSync(row.data);
        const tile = new VectorTile(new Protobuf(buffer));

        // Prepare layer information
        for (const [name, layer] of Object.entries(tile.layers)) {
          if (layerReports[name] == null) {
            layerReports[name] = {
              name,
              all: { attributes: {}, geometries: [], zoom_levels: [] },
            };
          }

          const layerReport = layerReports[name];

          // for each the layer's features
          for (let i = 0; i < layer.length; i++) {
            const feature = layer.feature(i);
            const properties = feature.properties;
            const geometry = VectorTileFeature.types[feature.type];
            const kind = properties['kind'];

            const reports = [layerReport.all];

            if (typeof kind === 'string') {
              if (layerReport.kinds == null) {
                layerReport.kinds = {};
              }

              if (layerReport.kinds[kind] == null) {
                layerReport.kinds[kind] = { attributes: {}, geometries: [], zoom_levels: [] };
              }

              reports.push(layerReport.kinds[kind]);
            }

            for (const report of reports) {
              // append attribute
              for (const [name, value] of Object.entries(properties)) {
                if (report.attributes[name] == null) {
                  report.attributes[name] = {
                    guaranteed: true,
                    num_unique_values: 0,
                    values: [],
                    types: [],
                  };
                }

                const attributeReport = report.attributes[name];

                // append type
                const type = typeof value;

                if (!attributeReport.types.includes(type)) {
                  attributeReport.types.push(type);
                }

                // handle value
                if (!attributeReport.values.includes(value)) {
                  attributeReport.num_unique_values++;

                  // append value based on the mode
                  if (args.mode === 'limited') {
                    if (attributeReport.num_unique_values < MaxValues) {
                      attributeReport.values.push(value);
                    }
                  } else if (args.mode === 'full') {
                    attributeReport.values.push(value);
                  }
                }

                // append geometry
                if (!report.geometries.includes(geometry)) {
                  report.geometries.push(geometry);
                }

                // append zoom level
                if (!report.zoom_levels.includes(row.z)) {
                  report.zoom_levels.push(row.z);
                }
              }

              // check the current feature's properties against the already captured attributes
              for (const [name, attribute] of Object.entries(report.attributes)) {
                if (attribute.guaranteed === true) {
                  if (properties[name] == null) {
                    attribute.guaranteed = false;
                  }
                }
              }
            }
          }
        }
      }

      logger.info({ zoomLevel }, 'End');
    }

    db.close();

    for (const [name, report] of Object.entries(layerReports)) {
      writeFileSync(new URL(`${name}.json`, args.target), JSON.stringify(report, null, 2));
    }
    logger.info('Reports: Done');
  },
});
