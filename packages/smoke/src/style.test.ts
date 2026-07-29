import assert from 'node:assert';
import { describe, it } from 'node:test';

import { assertCors, ctx } from './base.js';

describe('styles', () => {
  it('GET /v1/styles/topographic.json with CORS', async () => {
    const res = await ctx.req(`/v1/styles/topographic.json?api=${ctx.apiKey}`, { headers: ctx.Cors });
    assert.equal(res.status, 200);
    assertCors(res);
    const style = await res.json();
    assert.ok(style);
  });

  it('OPTIONS /v1/styles/topographic.json with CORS', async () => {
    const res = await ctx.req(`/v1/styles/topographic.json?api=${ctx.apiKey}`, {
      method: 'OPTIONS',
      headers: ctx.Cors,
    });
    assert.equal(res.status, 200);
    assertCors(res);
  });

  it('GET /v1/styles/elevation.json with CORS', async () => {
    const res = await ctx.req(`/v1/styles/elevation.json?api=${ctx.apiKey}&pipeline=color-ramp`, {
      headers: ctx.Cors,
    });
    assert.equal(res.status, 200);
    assertCors(res);
    const style = await res.json();
    assert.ok(style);
  });

  it('OPTIONS /v1/styles/elevation.json with CORS', async () => {
    const res = await ctx.req(`/v1/styles/elevation.json?api=${ctx.apiKey}`, {
      method: 'OPTIONS',
      headers: ctx.Cors,
    });
    assert.equal(res.status, 200);
    assertCors(res);
  });
});
