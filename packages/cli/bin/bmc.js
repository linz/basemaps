#!/usr/bin/env node
Error.stackTraceLimit = 100;
import { BasemapsConfigCommandLine } from '../build/cli/index.js';

new BasemapsConfigCommandLine().run();
