#!/usr/bin/env node
Error.stackTraceLimit = 100;
import { BasemapsConfig } from '../build/cli/bmc/index.js';

new BasemapsConfig().run();
