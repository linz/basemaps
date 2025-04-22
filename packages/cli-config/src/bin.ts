Error.stackTraceLimit = 100;
import { LogConfig } from '@basemaps/shared';
import { run, subcommands } from 'cmd-ts';

import { BundleAssetsCommand } from './cli/action.bundle.assets.js';
import { BundleCommand } from './cli/action.bundle.js';
import { ImportCommand } from './cli/action.import.js';

const Cli = subcommands({
  name: 'config',
  cmds: {
    bundle: BundleCommand,
    'bundle-assets': BundleAssetsCommand,
    import: ImportCommand,
  },
});

run(Cli, process.argv.slice(2)).catch((err) => {
  const logger = LogConfig.get();
  logger.fatal({ err }, 'Command:Failed');

  // Give the logger some time to flush before exiting
  setTimeout(() => process.exit(1), 25);
});
