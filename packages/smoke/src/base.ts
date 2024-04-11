import assert from 'node:assert';

import ulid from 'ulid';

/** Fresh API Key to use */
const apiKey = 'c' + ulid.ulid().toLowerCase().slice(0, 22) + 'test';

/** Http headers required to trigger CORS */
const Cors = { origin: 'https://example.com' };

/** Host that is being tested */
const host = new URL(process.env['BASEMAPS_HOST'] || 'https://dev.basemaps.linz.govt.nz');

if (!host.protocol.startsWith('http')) throw new Error(`Invalid host: ${host}`);

/**
 * Request a url with options
 *
 * @example
 * ```typescript
 * await req('/v1/version')
 * await req('/v1/version', { method: 'OPTIONS' })
 * await req(`/v1/version?api=${ctx.apiKey}`)
 * ````
 */
async function req(path: string, opts?: RequestInit): Promise<Response> {
  const target = new URL(path, host);

  const startTime = performance.now();
  const res = await fetch(target, opts);

  // eslint-disable-next-line no-console
  console.log({ url: target.href, status: res.status, ...opts, duration: performance.now() - startTime }, 'Fetch:Done');
  return res;
}

export const ctx = { host, Cors, apiKey, req };

/** Validate that the response was not a cached response */
export function assertCacheMiss(res: Response): void {
  const cacheHeader = res.headers.get('x-cache');
  if (cacheHeader == null) return; // No header is a miss
  assert.equal(cacheHeader.startsWith('Miss'), true, `Should be a cache Miss ${res.headers.get('x-cache')}`);
}
