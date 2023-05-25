import { LogConfig } from '@basemaps/shared';
import ulid from 'ulid';

const logger = LogConfig.get();
/** Fresh API Key to use */
const apiKey = 'c' + ulid.ulid().toLowerCase();

/** Http headers required to trigger CORS */
const Cors = { origin: 'https://example.com' };

/** Host that is being tested */
let host = process.env['BASEMAPS_HOST'] || 'https://dev.basemaps.linz.govt.nz';

if (!host.startsWith('http')) throw new Error(`Invalid host: ${host}`);
if (host.endsWith('/')) host = host.slice(0, host.length - 1);

/** Request a url with options
 *
 * @example
 * ```typescript
 * await req('/v1/version')
 * await req('/v1/version', { method: 'OPTIONS' })
 * ````
 */
async function req(path: string, opts?: RequestInit): Promise<Response> {
  logger.trace({ path }, 'Fetch');
  const startTime = performance.now();
  const res = await fetch(host + path, opts);
  logger.info({ path, status: res.status, ...opts, duration: performance.now() - startTime }, 'Fetch:Done');
  return res;
}

export const ctx = { logger, host, Cors, apiKey, req };
