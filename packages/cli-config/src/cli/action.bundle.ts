import { ConfigJson } from '@basemaps/config-loader';
import { fsa, getLogger, logArguments } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { Metrics } from '@linzjs/metrics';
import { command, option, optional, string } from 'cmd-ts';
import pLimit from 'p-limit';

export const DefaultConfig = 'config/';
export const DefaultOutput = 'config/config.json';

export const BundleCommand = command({
  name: 'bundle',
  version: CliInfo.version,
  description:
    'Given a path of config files and bundle them into one config json. Bundles a config json from config files.',
  args: {
    ...logArguments,
    config: option({
      type: string,
      long: 'config',
      description: 'Path of config files.',
      defaultValue: () => DefaultConfig,
      defaultValueIsSerializable: true,
    }),
    output: option({
      type: string,
      long: 'output',
      description: 'Output of the bundle file.',
      defaultValue: () => DefaultOutput,
      defaultValueIsSerializable: true,
    }),
    assets: option({
      type: optional(string),
      long: 'assets',
      description: 'Add assets location into the config bundle file.',
    }),
    cache: option({
      type: optional(string),
      long: 'cache',
      description: 'Location of the config cache to reduce number of requests needed to source file.',
    }),
  },

  async handler(args): Promise<void> {
    const metrics = new Metrics();
    const logger = getLogger(this, args);

    const configUrl = fsa.toUrl(args.config);
    const outputUrl = fsa.toUrl(args.output);
    const cacheLocation = args.cache ? fsa.toUrl(args.cache) : undefined;

    metrics.start('config:bundle');
    logger.info({ configUrl }, 'BundleConfig:Start');
    const q = pLimit(25);
    const mem = await ConfigJson.fromUrl(configUrl, q, logger, cacheLocation);
    if (args.assets != null) mem.assets = args.assets;

    const configJson = mem.toJson();
    await fsa.write(outputUrl, JSON.stringify(configJson));

    logger.info({ outputUrl }, 'BundleConfig:Finish');
    metrics.end('config:bundle');
  },
});
