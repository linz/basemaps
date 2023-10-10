import { LogConfig } from '@basemaps/shared';
import assert from 'node:assert';
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
  const target = new URL(path, host);
  logger.trace({ path, url: target.href }, 'Fetch');
  const startTime = performance.now();
  const res = await fetch(target, opts);
  logger.info(
    { path, url: target.href, status: res.status, ...opts, duration: performance.now() - startTime },
    'Fetch:Done',
  );
  return res;
}

export const ctx = { logger, host, Cors, apiKey, req };

/** Validate that the response was not a cached response */
export function assertCacheMiss(res: Response): void {
  const cacheHeader = res.headers.get('x-cache');
  if (cacheHeader == null) return; // No header is a miss
  assert.equal(cacheHeader.startsWith('Miss'), true, `Should be a cache Miss ${res.headers.get('x-cache')}`);
}
