#!/usr/bin/env node
import { subcommands } from 'cmd-ts';

import { BundleAssetsCommand } from './config/action.bundle.assets.js';
import { BundleCommand } from './config/action.bundle.js';
import { ImportCommand } from './config/action.import.js';

export const Cli = subcommands({
  name: 'bmc',
  description: 'Basemaps config command tools',
  cmds: {
    bundle: BundleCommand,
    'bundle-assets': BundleAssetsCommand,
    import: ImportCommand,
  },
});
