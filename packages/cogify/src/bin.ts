Error.stackTraceLimit = 100;

import { LogConfig } from '@basemaps/shared';
import { fsa } from '@basemaps/shared';
import { run } from 'cmd-ts';

import { CogifyCli } from './cogify/cli.js';

// remove the source caching / chunking as it is not needed for cogify, cogify only reads tiffs once so caching the result is not helpful
fsa.middleware = fsa.middleware.filter((f) => f.name !== 'source:chunk');
fsa.middleware = fsa.middleware.filter((f) => f.name !== 'source:cache');

run(CogifyCli, process.argv.slice(2)).catch((err) => {
  const logger = LogConfig.get();
  logger.fatal({ err }, 'Command:Failed');

  // Give the logger some time to flush before exiting
  setTimeout(() => process.exit(1), 25);
});
