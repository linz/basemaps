import { GoogleTms } from '@basemaps/geo';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, number, option, restPositionals } from 'cmd-ts';
import pLimit from 'p-limit';

import { getLogger, logArguments } from '../../log.js';
import { Url } from '../parsers.js';
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
    path: restPositionals({ type: Url, displayName: 'path', description: 'COG to validate' }),
  },

  async handler(args) {
    const logger = getLogger(this, args);
    const q = pLimit(args.concurrency);

    const promises = args.path.map((path) => {
      return q(() => validateOutputTiff(path, undefined, logger));
    });

    await Promise.allSettled(promises);
  },
});
