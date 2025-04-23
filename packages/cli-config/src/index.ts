import { subcommands } from 'cmd-ts';

import { BundleAssetsCommand } from './cli/action.bundle.assets.js';
import { BundleCommand } from './cli/action.bundle.js';
import { CreateConfigCommand } from './cli/action.create.config.js';
import { ImportCommand } from './cli/action.import.js';

export const ConfigCli = subcommands({
  name: 'config',
  cmds: {
    bundle: BundleCommand,
    'bundle-assets': BundleAssetsCommand,
    import: ImportCommand,
    'create-config': CreateConfigCommand,
  },
});
