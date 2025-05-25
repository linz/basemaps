#!/usr/bin/env node
import { ConfigCli } from '@basemaps/cli-config';
import { CogifyCli } from '@basemaps/cli-raster';
import { VectorCli  } from '@basemaps/cli-vector';
import { subcommands } from 'cmd-ts';

export const Cli = subcommands({
  name: 'bmc',
  description: 'Basemaps command tools',
  cmds: {
    config: ConfigCli,
    cogify: CogifyCli,
    vector: VectorCli,
  },
});
