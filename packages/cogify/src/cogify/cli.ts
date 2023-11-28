import { subcommands } from 'cmd-ts';

import { BasemapsCogifyCreateCommand } from './cli/cli.cog.js';
import { BasemapsCogifyConfigCommand } from './cli/cli.config.js';
import { BasemapsCogifyCoverCommand } from './cli/cli.cover.js';

export const CogifyCli = subcommands({
  name: 'cogify',
  cmds: {
    cover: BasemapsCogifyCoverCommand,
    create: BasemapsCogifyCreateCommand,
    config: BasemapsCogifyConfigCommand,
  },
});
