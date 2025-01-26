import { subcommands } from 'cmd-ts';

import { TopoStacCreationCommand } from '../topo-raster/cli/cli.stac.js';
import { BasemapsCogifyCreateCommand } from './cli/cli.cog.js';
import { BasemapsCogifyConfigCommand } from './cli/cli.config.js';
import { BasemapsCogifyCoverCommand } from './cli/cli.cover.js';
import { BasemapsCogifyValidateCommand } from './cli/cli.validate.js';

export const CogifyCli = subcommands({
  name: 'cogify',
  cmds: {
    cover: BasemapsCogifyCoverCommand,
    create: BasemapsCogifyCreateCommand,
    config: BasemapsCogifyConfigCommand,
    validate: BasemapsCogifyValidateCommand,
    stac: TopoStacCreationCommand,
  },
});
