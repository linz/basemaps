import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ctx } from './base.js';

describe('index.html', () => {
  it('should use the default basemaps-card', async () => {
    const res = await ctx.req('/index.html');

    assert.equal(res.status, 200);
    const body = await res.text();

    assert.equal(body.includes('content="/basemaps-card.jpeg"'), true, 'includes /basemaps-card.jpeg');
  });

  it('should swap the preview links when requested', async () => {
    const res = await ctx.req('/@-43.7302848,171.7870060,z10.37');

    assert.equal(res.status, 200);
    const body = await res.text();

    assert.equal(
      body.includes('content="/v1/preview/aerial/WebMercatorQuad/10.37/171.7870060/-43.7302848"'),
      true,
      'includes /v1/preview/aerial/WebMercatorQuad/10.37/171.7870060/-43.7302848',
    );
  });
});
