import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ctx } from './base.js';

describe('tile', () => {
  it('should serve a NZTM2000Quad', async () => {
    const res = await ctx.req(`/v1/tiles/aerial/NZTM2000Quad/16/33757/30417.webp?api=${ctx.apiKey}`);
    assert.equal(res.status, 200, res.statusText);
    const body = Buffer.from(await res.arrayBuffer());
    assert.equal(body.subarray(0, 4).toString(), 'RIFF');
  });

  it('should serve a tile as WebMercatorQuad', async () => {
    const res = await ctx.req(`/v1/tiles/aerial/WebMercatorQuad/17/129506/80410.webp?api=${ctx.apiKey}`);
    assert.equal(res.status, 200, res.statusText);

    const body = Buffer.from(await res.arrayBuffer());
    assert.equal(body.subarray(0, 4).toString(), 'RIFF');
  });

  it('should serve a vector tile', async () => {
    const res = await ctx.req(`/v1/tiles/topographic/WebMercatorQuad/15/32267/19905.pbf?api=${ctx.apiKey}`);
    assert.equal(res.status, 200, res.statusText);
  });

  for (const ext of ['png', 'jpeg', 'avif']) {
    it(`should serve a ${ext} tile`, async () => {
      const res = await ctx.req(`/v1/tiles/aerial/WebMercatorQuad/6/62/40.${ext}?api=${ctx.apiKey}`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), `image/${ext}`);
    });
  }

  it('should serve a preview', async () => {
    const res = await ctx.req(`/v1/preview/aerial/WebMercatorQuad/7.25/175.4665236/-41.1619890`);
    assert.equal(res.status, 200, res.statusText);

    const body = Buffer.from(await res.arrayBuffer());
    assert.equal(body.subarray(0, 4).toString(), 'RIFF');
  });
});
