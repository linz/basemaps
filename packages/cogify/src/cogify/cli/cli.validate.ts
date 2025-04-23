import { getLogger, logArguments, Url } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, number, option, restPositionals } from 'cmd-ts';
import pLimit from 'p-limit';

import { validateOutputTiff } from './cli.cog.js';

export const BasemapsCogifyValidateCommand = command({
  name: 'cogify-validate',
  version: CliInfo.version,
  description: 'Validate a COG is created in a way basemaps likes',
  args: {
    ...logArguments,
    concurrency: option({
      type: number,
      long: 'concurrency',
      description: 'How many COGs to initialise at once',
      defaultValue: () => 25,
      defaultValueIsSerializable: true,
    }),
    tiffs: restPositionals({ type: Url, displayName: 'paths', description: 'COG to validate' }),
  },

  async handler(args) {
    const logger = getLogger(this, args);
    const q = pLimit(args.concurrency);

    const promises = args.tiffs.map((tiff) => {
      return q(() => validateOutputTiff(tiff, undefined, logger));
    });

    await Promise.allSettled(promises);
  },
});
