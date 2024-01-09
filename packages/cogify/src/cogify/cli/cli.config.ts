import { base58, ConfigProviderMemory } from '@basemaps/config';
import { ConfigImageryTiff, initImageryFromTiffUrl } from '@basemaps/config-loader';
import { Projection, TileMatrixSets } from '@basemaps/geo';
import { fsa, urlToString } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { Metrics } from '@linzjs/metrics';
import { command, number, option, optional, positional } from 'cmd-ts';
import pLimit from 'p-limit';
import { promisify } from 'util';
import { gzip } from 'zlib';

import { isArgo } from '../../argo.js';
import { getLogger, logArguments } from '../../log.js';
import { UrlFolder } from '../parsers.js';

const gzipPromise = promisify(gzip);

export const BasemapsCogifyConfigCommand = command({
  name: 'cogify-config',
  version: CliInfo.version,
  description: 'Create a Basemaps configuration from a path to imagery',
  args: {
    ...logArguments,
    target: option({
      type: optional(UrlFolder),
      long: 'target',
      description: 'Where to write the config json, Defaults to imagery path',
    }),
    concurrency: option({
      type: number,
      long: 'concurrency',
      description: 'How many COGs to initialise at once',
      defaultValue: () => 25,
      defaultValueIsSerializable: true,
    }),
    path: positional({ type: UrlFolder, displayName: 'path', description: 'Path to imagery' }),
  },

  async handler(args) {
    const metrics = new Metrics();
    const logger = getLogger(this, args);
    const provider = new ConfigProviderMemory();
    const q = pLimit(args.concurrency);

    metrics.start('imagery:load');
    const im = await initImageryFromTiffUrl(provider, args.path, q, logger);
    metrics.end('imagery:load');

    logger.info({ files: im.files.length, titles: im.title }, 'ImageryConfig:Loaded');

    const config = provider.toJson();
    const outputPath = new URL(`basemaps-config-${config.hash}.json.gz`, args.target ?? args.path);
    logger.info({ output: outputPath, hash: config.hash }, 'ImageryConfig:Write');
    await fsa.write(outputPath, await gzipPromise(JSON.stringify(config)));

    const configPath = base58.encode(Buffer.from(outputPath.href));
    const location = getImageryCenterZoom(im);
    const targetZoom = location.zoom;
    const lat = location.lat.toFixed(7);
    const lon = location.lon.toFixed(7);
    const locationHash = `@${lat},${lon},z${location.zoom}`;

    const url = `https://basemaps.linz.govt.nz/${locationHash}?i=${im.name}&tileMatrix=${im.tileMatrix}&debug&config=${configPath}`;
    const urlPreview = `https://basemaps.linz.govt.nz/v1/preview/${im.name}/${im.tileMatrix}/${targetZoom}/${lon}/${lat}?config=${configPath}`;

    logger.info(
      {
        imageryId: im.id,
        path: outputPath,
        url,
        urlPreview,
        config: configPath,
        title: im.title,
        tileMatrix: im.tileMatrix,
        projection: im.projection,
      },
      'ImageryConfig:Done',
    );

    if (isArgo()) {
      // Path to where the config is located
      await fsa.write(fsa.toUrl('/tmp/cogify/config-path'), urlToString(outputPath));
      // A URL to where the imagery can be viewed
      await fsa.write(fsa.toUrl('/tmp/cogify/config-url'), url);
    }

    logger.info({ metrics: metrics.metrics }, 'ImageryConfig:Metrics');
  },
});

function getImageryCenterZoom(im: ConfigImageryTiff): { lat: number; lon: number; zoom: number } {
  const center = { x: im.bounds.x + im.bounds.width / 2, y: im.bounds.y + im.bounds.height / 2 };
  const tms = TileMatrixSets.find(im.tileMatrix);
  if (tms == null) throw new Error(`Failed to lookup tileMatrix: ${im.tileMatrix}`);
  const proj = Projection.get(tms);
  const centerLatLon = proj.toWgs84([center.x, center.y]);
  const targetZoom = Math.max(tms.findBestZoom(im.gsd) - 12, 0);
  return { lat: centerLatLon[1], lon: centerLatLon[0], zoom: targetZoom };
}
