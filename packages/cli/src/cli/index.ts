#!/usr/bin/env node
import { BundleAssetsCommand, BundleCommand, ImportCommand } from '@basemaps/cli-config';
import { subcommands } from 'cmd-ts';

export const Cli = subcommands({
  name: 'bmc',
  description: 'Basemaps command tools',
  cmds: {
    config: subcommands({
      name: 'config',
      cmds: {
        bundle: BundleCommand,
        'bundle-assets': BundleAssetsCommand,
        import: ImportCommand,
      },
    }),
  },
});
