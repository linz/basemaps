import { subcommands } from 'cmd-ts';

import { BundleAssetsCommand } from './cli/action.bundle.assets.js';
import { BundleCommand } from './cli/action.bundle.js';
import { CreateConfigCommand } from './cli/action.create.config.js';
import { ImportCommand } from './cli/action.import.js';
import { DiffCommand } from './cli/action.diff.js';

export const ConfigCli = subcommands({
  name: 'config',
  cmds: {
    bundle: BundleCommand,
    'bundle-assets': BundleAssetsCommand,
    'create-config': CreateConfigCommand,
    diff: DiffCommand,
    import: ImportCommand,
  },
});
