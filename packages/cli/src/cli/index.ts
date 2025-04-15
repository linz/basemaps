#!/usr/bin/env node
import { BundleAssetsCommand, BundleCommand, ImportCommand } from '@basemaps/cli-config';
import { subcommands } from 'cmd-ts';

export const Cli = subcommands({
  name: 'bmc',
  description: 'Basemaps config command tools',
  cmds: {
    bundle: BundleCommand,
    'bundle-assets': BundleAssetsCommand,
    import: ImportCommand,
  },
});
