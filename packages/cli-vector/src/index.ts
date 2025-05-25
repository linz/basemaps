// eslint-disable-next-line simple-import-sort/imports
import { subcommands } from 'cmd-ts';
import { ExtractCommand } from './cli/cli.extract.js';
import { CreateCommand } from './cli/cli.create.js';

export const VectorCli = subcommands({
  name: 'vector',
  cmds: {
    extract: ExtractCommand,
    create: CreateCommand,
  },
});
