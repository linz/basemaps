import assert from 'node:assert';
import { describe, it } from 'node:test';

import { assertCacheMiss, ctx } from './base.js';

describe('health', () => {
  it('should 200 when GET /v1/ping', async () => {
    const res = await ctx.req('/v1/ping');
    assert.equal(res.status, 200);
    assertCacheMiss(res);
  });

  it('should 200 when GET /v1/health', async () => {
    const res = await ctx.req('/v1/health');
    assert.equal(res.status, 200);
    assertCacheMiss(res);
  });

  it('should 200 when GET /v1/version', async () => {
    const res = await ctx.req('/v1/version');
    assert.equal(res.status, 200);
    assertCacheMiss(res);

    const data = await res.json();

    assert.equal(typeof data.version, 'string');
    assert.ok(data.version);

    assert.equal(typeof data.hash, 'string');
    assert.ok(data.hash);
  });
});
