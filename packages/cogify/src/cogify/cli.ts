import { subcommands } from 'cmd-ts';

import { BasemapsCogifyCreateCommand } from './cli/cli.cog.js';
import { BasemapsCogifyConfigCommand } from './cli/cli.config.js';
import { BasemapsCogifyCoverCommand } from './cli/cli.cover.js';
import { BasemapsCogifyValidateCommand } from './cli/cli.validate.js';
import { BasemapsCogifyElevationCommand } from './cli/cli.elevation.js';

export const CogifyCli = subcommands({
  name: 'cogify',
  cmds: {
    cover: BasemapsCogifyCoverCommand,
    create: BasemapsCogifyCreateCommand,
    config: BasemapsCogifyConfigCommand,
    validate: BasemapsCogifyValidateCommand,
    elevation: BasemapsCogifyElevationCommand,
  },
});
