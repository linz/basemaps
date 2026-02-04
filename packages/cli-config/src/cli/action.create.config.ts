import { base58, ConfigProviderMemory } from '@basemaps/config';
import { initImageryFromTiffUrl } from '@basemaps/config-loader';
import { fsa, getLogger, getPreviewUrl, isArgo, logArguments, Url, UrlFolder, urlToString } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { Metrics } from '@linzjs/metrics';
import { command, number, option, optional, positional } from 'cmd-ts';
import pLimit from 'p-limit';
import { pathToFileURL } from 'url';
import { promisify } from 'util';
import { gzip } from 'zlib';

const gzipPromise = promisify(gzip);

export const CreateConfigCommand = command({
  name: 'create-config',
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
      type: Url,
      long: 'host',
      description: 'Which host to use as the base for for preview generation links',
      defaultValue: () => new URL('https://basemaps.linz.govt.nz'),
      defaultValueIsSerializable: true,
    }),
    output: option({
      type: optional(UrlFolder),
      long: 'output',
      description: 'Where to write the create-config-output locations to',
    }),
    path: positional({ type: UrlFolder, displayName: 'path', description: 'Path to imagery' }),
  },

  async handler(args) {
    const metrics = new Metrics();
    const logger = getLogger(this, args, 'cli-config');
    const provider = new ConfigProviderMemory();
    const q = pLimit(args.concurrency);

    metrics.start('imagery:load');
    const im = await initImageryFromTiffUrl(args.path, q, undefined, logger);
    const ts = ConfigProviderMemory.imageryToTileSet(im);
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
    const center = getPreviewUrl({ imagery: im, config: configPath, pipeline: output?.name });

    const url = new URL(center.url, args.host); // host
    url.pathname = center.slug; // location
    url.searchParams.set('style', center.name);
    if (im.tileMatrix !== 'WebMercatorQuad') url.searchParams.set('tileMatrix', im.tileMatrix);
    url.searchParams.set('debug', 'true'); // debug mode

    const urlPreview = new URL(center.url, args.host);

    logger.info(
      {
        imageryId: im.id,
        configUrl: outputPath,
        url,
        urlPreview, // used for slack alert images
        config: configPath,
        title: im.title,
        tileMatrix: im.tileMatrix,
        projection: im.projection,
      },
      'ImageryConfig:Done',
    );

    if (isArgo() || args.output != null) {
      const target = args.output ?? fsa.toUrl('/tmp/cogify/');
      // Path to where the config is located
      await fsa.write(new URL('config-path', target), urlToString(outputPath));
      // A URL to where the imagery can be viewed
      await fsa.write(new URL('config-url', target), urlToString(url));
      // A URL to the preview image
      await fsa.write(new URL('config-url-preview', target), urlToString(urlPreview));
    }

    logger.info({ metrics: metrics.metrics }, 'ImageryConfig:Metrics');
  },
});
