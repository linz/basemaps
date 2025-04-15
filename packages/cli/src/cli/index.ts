#!/usr/bin/env node
import { subcommands } from 'cmd-ts';

import { BundleAssetsCommand, BundleCommand, ImportCommand } from '@basemaps/cli-config';

export const Cli = subcommands({
  name: 'bmc',
  description: 'Basemaps config command tools',
  cmds: {
    bundle: BundleCommand,
    'bundle-assets': BundleAssetsCommand,
    import: ImportCommand,
  },
});
