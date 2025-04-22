#!/usr/bin/env node
import { CliConfig } from '@basemaps/cli-config';
import { subcommands } from 'cmd-ts';

export const Cli = subcommands({
  name: 'bmc',
  description: 'Basemaps command tools',
  cmds: {
    config: CliConfig,
  },
});
