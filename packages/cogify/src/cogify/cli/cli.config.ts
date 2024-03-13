import { base58, ConfigProviderMemory, ConfigTileSetRaster } from '@basemaps/config';
import { initImageryFromTiffUrl } from '@basemaps/config-loader';
import { fsa, getPreviewUrl, urlToString } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { Metrics } from '@linzjs/metrics';
import { command, number, option, optional, positional } from 'cmd-ts';
import pLimit from 'p-limit';
import { promisify } from 'util';
import { gzip } from 'zlib';

import { isArgo } from '../../argo.js';
import { getLogger, logArguments } from '../../log.js';
import { Url, UrlFolder } from '../parsers.js';

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
    host: option({
      type: optional(Url),
      long: 'host',
      description: 'Which host to use as the base for for preview generation links',
      defaultValue: () => new URL('https://basemaps.linz.govt.nz'),
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
    const im = await initImageryFromTiffUrl(args.path, q, undefined, logger);
    const ts = ConfigProviderMemory.imageryToTileSet(im) as ConfigTileSetRaster;
    provider.put(im);
    metrics.end('imagery:load');

    logger.info({ files: im.files.length, titles: im.title }, 'ImageryConfig:Loaded');

    const config = provider.toJson();
    const outputPath = new URL(`basemaps-config-${config.hash}.json.gz`, args.target ?? args.path);
    logger.info({ output: outputPath, hash: config.hash }, 'ImageryConfig:Write');
    await fsa.write(outputPath, await gzipPromise(JSON.stringify(config)));

    const configPath = base58.encode(Buffer.from(outputPath.href));

    // previews default to webp, so find the first output that supports web to make our life easier
    const output = ts.outputs?.find((f) => f.format == null || f.format.includes('webp'));
    const p = getPreviewUrl({ imagery: im, config: configPath, pipeline: output?.name });

    const url = new URL(`/${p.slug}?style=${p.name}&tileMatrix=${im.tileMatrix}&debug&config=${configPath}`, args.host);
    const urlPreview = new URL(p.url, args.host);

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
      await fsa.write(fsa.toUrl('/tmp/cogify/config-url'), urlToString(url));
    }

    logger.info({ metrics: metrics.metrics }, 'ImageryConfig:Metrics');
  },
});
