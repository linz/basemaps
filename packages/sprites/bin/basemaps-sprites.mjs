#!/usr/bin/env node

import { run } from 'cmd-ts';

import { SpriteCli } from '../build/cli.js';

run(SpriteCli, process.argv.slice(2)).catch((err) => {
  console.error({ err }, 'Command:Failed');
});
