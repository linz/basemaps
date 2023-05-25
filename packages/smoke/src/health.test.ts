import assert from 'node:assert';
import { test } from 'node:test';
import { ctx } from './base.js';

test('GET /v1/ping', async () => {
  const res = await ctx.req('/v1/ping');
  assert.equal(res.status, 200);
});

test('GET /v1/health', async () => {
  const res = await ctx.req('/v1/health');
  assert.equal(res.status, 200);
});

test('GET /v1/version', async () => {
  const res = await ctx.req('/v1/version');
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.ok(data.version);
  assert.ok(data.hash);
});
