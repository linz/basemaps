#!/usr/bin/env node

import { BasemapsServerCommand } from '../build/cli.js';
BasemapsServerCommand.run().catch((error) => {
    if (error.oclif) return require('@oclif/errors/handle')(error);
    console.log(error);
});
