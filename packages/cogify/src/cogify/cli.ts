import { subcommands } from 'cmd-ts';
import { BasemapsCogifyCreateCommand } from './cli/cli.cog.js';
import { BasemapsCogifyCoverCommand } from './cli/cli.cover.js';
import { BasemapsCogifyValidateCommand } from './cli/cli.validate.js';

export const CogifyCli = subcommands({
  name: 'cogify',
  cmds: {
    cover: BasemapsCogifyCoverCommand,
    create: BasemapsCogifyCreateCommand,
    validate: BasemapsCogifyValidateCommand,
  },
});
