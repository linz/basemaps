import { subcommands } from 'cmd-ts';

import { CreateCommand } from './cli/cli.create.js';
import { DocsCommand } from './cli/cli.docs.js';
import { ExtractCommand } from './cli/cli.extract.js';
import { JoinCommand } from './cli/cli.join.js';
import { ReportsCommand } from './cli/cli.reports.js';

export const VectorCli = subcommands({
  name: 'vector',
  cmds: {
    extract: ExtractCommand,
    create: CreateCommand,
    join: JoinCommand,
    reports: ReportsCommand,
    docs: DocsCommand,
  },
});
