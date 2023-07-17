import { ConfigProviderMemory, base58 } from '@basemaps/config';
import { ConfigImageryTiff, initConfigFromUrls } from '@basemaps/config/build/json/tiff.config.js';
import { Projection, TileMatrixSets } from '@basemaps/geo';
import { fsa } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { Metrics } from '@linzjs/metrics';
import { command, option, optional, positional } from 'cmd-ts';
import { isArgo } from '../../argo.js';
import { urlToString } from '../../download.js';
import { getLogger, logArguments } from '../../log.js';
import { Url } from '../parsers.js';

export const BasemapsCogifyConfigCommand = command({
  name: 'cogify-config',
  version: CliInfo.version,
  description: 'Create a Basemaps configuration from a path to imagery',
  args: {
    ...logArguments,
    target: option({
      type: optional(Url),
      long: 'target',
      description: 'Where to write the config json, Defaults to imagery path',
    }),
    path: positional({ type: Url, displayName: 'path', description: 'Path to imagery' }),
  },

  async handler(args) {
    const metrics = new Metrics();
    const logger = getLogger(this, args);

    const mem = new ConfigProviderMemory();
    metrics.start('imagery:load');
    const cfg = await initConfigFromUrls(mem, [args.path]);
    metrics.end('imagery:load');
    logger.info({ imagery: cfg.imagery.length, titles: cfg.imagery.map((f) => f.title) }, 'ImageryConfig:Loaded');

    const config = mem.toJson();
    const outputPath = urlToString(new URL(`basemaps-config-${config.hash}.json.gz`, args.target ?? args.path));

    logger.info({ output: outputPath, hash: config.hash }, 'ImageryConfig:Write');
    await fsa.writeJson(outputPath, config);
    const configPath = base58.encode(Buffer.from(outputPath));

    const outputUrls: string[] = [];
    for (const im of cfg.imagery) {
      const location = getImageryCenterZoom(im);
      const locationHash = `#@${location.lat.toFixed(7)},${location.lon.toFixed(7)},z${location.zoom}`;
      const url = `https://basemaps.linz.govt.nz/?config=${configPath}&i=${im.name}&tileMatrix=${im.tileMatrix}&debug${locationHash}`;
      outputUrls.push(url);
      logger.info(
        {
          path: outputPath,
          url,
          config: configPath,
          title: im.title,
          tileMatrix: im.tileMatrix,
          projection: im.projection,
        },
        'ImageryConfig:Done',
      );
    }

    if (isArgo()) {
      // Path to where the config is located
      await fsa.write('/tmp/cogify/config-path', outputPath);
      // A URL to where the imagery can be viewed
      await fsa.write('/tmp/cogify/config-url.json', JSON.stringify(outputUrls));
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
