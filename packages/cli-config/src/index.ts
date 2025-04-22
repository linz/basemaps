export { BundleAssetsCommand } from './cli/action.bundle.assets.js';
export { BundleCommand } from './cli/action.bundle.js';
export { ImportCommand } from './cli/action.import.js';

import { subcommands } from 'cmd-ts';

import { BundleAssetsCommand } from './cli/action.bundle.assets.js';
import { BundleCommand } from './cli/action.bundle.js';
import { ImportCommand } from './cli/action.import.js';

export const CliConfig = subcommands({
  name: 'config',
  cmds: {
    bundle: BundleCommand,
    'bundle-assets': BundleAssetsCommand,
    import: ImportCommand,
  },
});
