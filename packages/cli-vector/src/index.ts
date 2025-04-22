// eslint-disable-next-line simple-import-sort/imports
import { subcommands } from 'cmd-ts';
import { ExtractCommand } from './cli/cli.extract.js';

export const vectorCli = subcommands({
  name: 'vector',
  cmds: {
    extract: ExtractCommand,
  },
});
