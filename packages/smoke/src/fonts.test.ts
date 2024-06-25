import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ctx } from './base.js';

describe('fonts', () => {
  it('GET /v1/fonts.json', async () => {
    const res = await ctx.req('/v1/fonts.json');
    assert.equal(res.status, 200);
    const data = (await res.json()) as string[];
    assert.ok(data.length > 0);
    assert.ok(data.includes('Noto Sans Regular'));
  });

  it('GET /v1/fonts/Noto Sans Bold/0-255.pbf', async () => {
    const res = await ctx.req('/v1/fonts/Noto Sans Bold/0-255.pbf');
    assert.equal(res.status, 200);
  });
});
