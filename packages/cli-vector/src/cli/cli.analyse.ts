import sq from 'node:sqlite';

import { fsa, Url } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { getLogger, logArguments } from '@basemaps/shared/build/cli/log.js';
import { VectorTile } from '@mapbox/vector-tile';
import { command, option } from 'cmd-ts';
import { readFileSync } from 'fs';
import Mustache from 'mustache';
import sizeof from 'object-sizeof';
import { basename } from 'path';
import Protobuf from 'pbf';
import { gunzip } from 'zlib';

interface TileInfo {
  x: number;
  y: number;
  z: number;
  max: number;
  size?: string;
  link?: string;
}

interface Distribution {
  distribution: string;
  tiles: number;
  percentage: string;
}

interface LayerSum {
  features: number;
  totalGeometry: number;
  totalAttributes: number;
}

interface LayerInfo {
  name: string;
  features: number;
  totalGeometry: string;
  totalAttributes: string;
  totalSize: string;
}

interface AnalysisData {
  zoom: number;
  maxTile: TileInfo;
  distributions: Distribution[];
  layers: LayerInfo[];
}

function distribution(size: number): string {
  if (size <= 10000) return '0-10KB';
  if (size <= 50000) return '10-50KB';
  if (size <= 100000) return '50-100KB';
  if (size <= 200000) return '100-200KB';
  if (size <= 500000) return '200-500KB';
  return '>500KB';
}

export const AnalyseArgs = {
  ...logArguments,
  path: option({
    long: 'path',
    type: Url,
    description: 'Path to mbtiles',
  }),
  template: option({
    long: 'template',
    defaultValue: () => 'analysis/template.md',
    defaultValueIsSerializable: true,
    description: 'Path of analysis template',
  }),
  target: option({
    long: 'target',
    type: Url,
    description: 'Target location for the result file',
  }),
};

export const AnalyseCommand = command({
  name: 'analyse',
  version: CliInfo.version,
  description: 'Analyse vector mbtiles',
  args: AnalyseArgs,
  async handler(args) {
    const logger = getLogger(this, args, 'cli-vector');
    logger.info('AnalyseMbTiles: Start');

    const analysisData: AnalysisData[] = [];

    let mbtilesFile = args.path.pathname;
    if (args.path.protocol !== 'file:') {
      logger.info('Download Start');
      const fileName = basename(args.path.pathname);
      const localFile = fsa.toUrl(`tmp/${fileName}`);
      await fsa.head(args.path);
      const stream = fsa.readStream(args.path);
      await fsa.write(localFile, stream);
      mbtilesFile = localFile.pathname;
      logger.info('Download End');
    }

    logger.info({ mbtilesFile }, 'Read mbtiles');

    const db = new sq.DatabaseSync(mbtilesFile);
    const MaxZoom = 15;
    for (let i = 0; i <= MaxZoom; i++) {
      const result = db
        .prepare(
          'SELECT tile_column as x, ((1 << zoom_level) - 1 - tile_row) as y, zoom_level as z, tile_data FROM tiles WHERE zoom_level=?',
        )
        .all(i) as [{ x: number; y: number; z: number; tile_data: Buffer }];

      let maxTile: TileInfo = { x: 0, y: 0, z: 0, max: 0 };
      const layersSum = new Map<string, LayerSum>();
      const distributionSum = new Map<string, number>();

      for (const row of result) {
        const buffer: Buffer = await new Promise((resolve) => {
          gunzip(row.tile_data, (_, buffer) => resolve(buffer));
        });
        const tile = new VectorTile(new Protobuf(buffer));

        if (buffer.length > maxTile.max)
          maxTile = {
            x: row.x,
            y: row.y,
            z: row.z,
            max: buffer.length,
            link: `https://basemaps.linz.govt.nz/v1/tiles/topographic/WebMercatorQuad/${row.z}/${row.z}/${row.y}.pbf`,
          };

        // Prepare distribution
        const dis = distribution(buffer.length);
        const value = distributionSum.get(dis);
        if (value == null) {
          distributionSum.set(dis, 1);
        } else {
          distributionSum.set(dis, value + 1);
        }

        // Prepare layer information
        for (const [name, layer] of Object.entries(tile.layers)) {
          let features = layer.length;

          // Calculate the total features size
          let totalGeometry = 0;
          let totalAttributes = 0;
          for (let i = 0; i < layer.length; i++) {
            const feature = layer.feature(i);
            const properties = sizeof(feature.properties);
            const geometry = sizeof(feature.loadGeometry());
            totalGeometry += properties;
            totalAttributes += geometry;
          }

          // Cumulative total features and sizes
          const layerInfo = layersSum.get(name);
          if (layerInfo) {
            features += layerInfo.features;
            totalGeometry += layerInfo.totalGeometry;
            totalAttributes += layerInfo.totalAttributes;
          }
          layersSum.set(name, { features, totalGeometry, totalAttributes });
        }
      }

      // Prepare printable max tile
      maxTile.size = `${(maxTile.max / 1000).toFixed(1)}KB`;

      // Prepare printable distributions
      const distributions: Distribution[] = [];
      for (const [distribution, tiles] of distributionSum) {
        const percentage = `${((tiles * 100) / result.length).toFixed(1)}%`;
        distributions.push({ distribution, tiles, percentage });
      }

      // Prepare printable layers
      const layers: LayerInfo[] = [];
      for (const [name, layerInfo] of layersSum) {
        const features = layerInfo.features;
        const totalGeometry = `${(layerInfo.totalGeometry / 1000).toFixed(1)}KB`;
        const totalAttributes = `${(layerInfo.totalAttributes / 1000).toFixed(1)}KB`;
        const totalSize = `${((layerInfo.totalGeometry + layerInfo.totalAttributes) / 1000).toFixed(1)}KB`;
        layers.push({ name, features, totalGeometry, totalAttributes, totalSize });
      }

      const data: AnalysisData = {
        zoom: i,
        maxTile,
        distributions,
        layers,
      };
      analysisData.push(data);
    }
    db.close();

    logger.info('Finished reading mbtiles');

    const template = readFileSync(args.template).toString();
    const output = Mustache.render(template, { data: analysisData });
    await fsa.write(new URL('report.md', args.target), Buffer.from(output, 'utf8'));
  },
});
