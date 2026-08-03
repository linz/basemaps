// eslint-disable-next-line simple-import-sort/imports
import { subcommands } from 'cmd-ts';

import { AnalyseCommand } from './cli/cli.analyse.js';
import { CreateCommand } from './cli/cli.create.js';
import { ExtractCommand } from './cli/cli.extract.js';
import { JoinCommand } from './cli/cli.join.js';

export const VectorCli = subcommands({
  name: 'vector',
  cmds: {
    extract: ExtractCommand,
    create: CreateCommand,
    join: JoinCommand,
    analyse: AnalyseCommand,
  },
});
