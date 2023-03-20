#!/usr/bin/env node

import { SpriteCli } from '../build/cli.js';
import { run } from 'cmd-ts';

run(SpriteCli, process.argv.slice(2)).catch((err) => {
  console.error({ err }, 'Command:Failed');
});
