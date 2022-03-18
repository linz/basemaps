#!/usr/bin/env node

if (process.env.AWS_REGION == null) process.env.AWS_REGION = process.env.AWS_DEFAULT_REGION;

import { BasemapsServerCommand } from '../build/cli.js';
import Errors from '@oclif/errors/handle.js';

BasemapsServerCommand.run(void 0, import.meta.url).catch((error) => {
  if (error.oclif) return Errors(error);
  console.log(error);
});
