import { subcommands } from 'cmd-ts';

import { TopoStacCreationCommand } from './cli/cli.stac.js';

export const TopoRasterCli = subcommands({
  name: 'topo-raster',
  cmds: {
    stac: TopoStacCreationCommand,
  },
});
