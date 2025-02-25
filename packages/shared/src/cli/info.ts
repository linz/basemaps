import * as ulid from 'ulid';

import { GitTag } from './git.tag.js';

/** Useful traceability information  */
export const CliInfo: { package: string; version: string; hash: string; buildId?: string } = {
  // Detect unlinked packages looks for this string since its a package name, slightly work around it
  package: '@' + 'basemaps/cli',
  version: process.env['GIT_VERSION'] ?? GitTag().version,
  hash: process.env['GIT_HASH'] ?? GitTag().hash,
  buildId: process.env['BUILD_ID'],
};

/** ISO date of when this command was run */
export const CliDate = new Date().toISOString();

/** Unique Id for this instance of the cli being run */
export const CliId = ulid.ulid();
