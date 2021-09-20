#!/usr/bin/env node

import { BasemapsServerCommand } from '../build/cli.js';
import Errors from '@oclif/errors/handle.js';
BasemapsServerCommand.run().catch((error) => {
  if (error.oclif) return Errors(error);
  console.log(error);
});
