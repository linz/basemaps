Error.stackTraceLimit = 100;
import { LogConfig } from '@basemaps/shared';
import { run } from 'cmd-ts';

import { VectorCli } from './index.js';

run(VectorCli, process.argv.slice(2)).catch((err) => {
  const logger = LogConfig.get();
  logger.fatal({ err }, 'Command:Failed');

  // Give the logger some time to flush before exiting
  setTimeout(() => process.exit(1), 25);
});
