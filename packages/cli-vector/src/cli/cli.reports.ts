import { DatabaseSync } from 'node:sqlite';

import { Url, UrlFolder } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { VectorTile, VectorTileFeature } from '@mapbox/vector-tile';
import { command, oneOf, option } from 'cmd-ts';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import Protobuf from 'pbf';
import { gunzipSync } from 'zlib';

import { AttributeReport, FeaturesReport, LayerReport } from '../schema-loader/schema.js';

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
  /**
   * The `mode` argument can be useful, depending on what you want to check.
   *
   * For example, if you're generating reports to check an mbtiles file's contents,
   * you can control how many values for each attribute to include in the generated
   * reports. If you don't intend to check the values themselves, you can skip the
   * 'value capturing' process entirely to speed up the command's execution time.
   */
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

    const db = new DatabaseSync(args.mbtiles);
    const layerReports: Record<string, LayerReport> = {};

    /**
     * for each zoom level
     */
    for (let zoomLevel = 0; zoomLevel <= MaxZoom; zoomLevel++) {
      logger.info({ zoomLevel }, 'Start');

      const tiles = db
        .prepare(
          'SELECT tile_column AS x, tile_row AS y, zoom_level AS z, tile_data AS data ' +
            'FROM tiles ' +
            'WHERE zoom_level = ?',
        )
        .all(zoomLevel) as { x: number; y: number; z: number; data: Buffer }[];

      /**
       * for each of the zoom level's tiles
       */
      for (const { x, y, z, data } of tiles) {
        logger.info({ x, y, z }, 'Start');

        const buffer = gunzipSync(data);
        const tile = new VectorTile(new Protobuf(buffer));

        /**
         * for each of the tile's layers
         */
        for (const [name, layer] of Object.entries(tile.layers)) {
          if (layerReports[name] == null) {
            // init a report for the current layer
            layerReports[name] = {
              name,
              all: { attributes: {}, geometries: [], zoom_levels: [] },
            } as LayerReport;
          }

          const layerReport = layerReports[name];

          /**
           * for each of the layer's features
           */
          for (let i = 0; i < layer.length; i++) {
            const feature = layer.feature(i);
            const properties = feature.properties;
            const geometry = VectorTileFeature.types[feature.type];
            const kind = properties['kind'];

            // the list of reports for which to capture the current feature's details
            const featureReports: FeaturesReport[] = [layerReport.all];

            if (typeof kind === 'string') {
              if (layerReport.kinds == null) {
                layerReport.kinds = {};
              }

              if (layerReport.kinds[kind] == null) {
                // init a report for the current kind
                layerReport.kinds[kind] = { attributes: {}, geometries: [], zoom_levels: [] } as FeaturesReport;
              }

              // we also want to capture the feature's details against the corresponding 'kind' report
              featureReports.push(layerReport.kinds[kind]);
            }

            for (const featureReport of featureReports) {
              /**
               * for each of the feature's attributes  (a.k.a. properties)
               */
              for (const [name, value] of Object.entries(properties)) {
                if (featureReport.attributes[name] == null) {
                  // init a report for the current attribute
                  featureReport.attributes[name] = {
                    guaranteed: true,
                    num_unique_values: 0,
                    values: [],
                    types: [],
                  } as AttributeReport;
                }

                const attributeReport = featureReport.attributes[name];

                // capture the feature's type
                const type = typeof value;

                if (!attributeReport.types.includes(type)) {
                  attributeReport.types.push(type);
                }

                // capture the feature's value
                if (!attributeReport.values.includes(value)) {
                  attributeReport.num_unique_values++;

                  if (args.mode === 'limited') {
                    if (attributeReport.num_unique_values < MaxValues) {
                      attributeReport.values.push(value);
                    }
                  } else if (args.mode === 'full') {
                    attributeReport.values.push(value);
                  }
                }

                // capture the feature's geometry
                if (!featureReport.geometries.includes(geometry)) {
                  featureReport.geometries.push(geometry);
                }

                // capture the feature's zoom level
                if (!featureReport.zoom_levels.includes(z)) {
                  featureReport.zoom_levels.push(z);
                }
              }

              // check the current feature's properties against the attributes already captured in the current report.
              // an attribute is only 'guaranteed' if all features describe it
              for (const [name, attribute] of Object.entries(featureReport.attributes)) {
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

    // write each report to the target directory
    for (const [name, report] of Object.entries(layerReports)) {
      writeFileSync(new URL(`${name}.json`, args.target), JSON.stringify(report, null, 2));
    }
    logger.info('Reports: Done');
  },
});
