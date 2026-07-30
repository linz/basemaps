import assert from 'node:assert';
import { describe, it } from 'node:test';

import { assertCors, ctx } from './base.js';

describe('tile', () => {
  it('should serve a NZTM2000Quad with CORS', async () => {
    const res = await ctx.req(`/v1/tiles/aerial/NZTM2000Quad/16/33757/30417.webp?api=${ctx.apiKey}`, {
      headers: ctx.Cors,
    });
    assert.equal(res.status, 200, res.statusText);
    assertCors(res);
    const body = Buffer.from(await res.arrayBuffer());
    assert.equal(body.subarray(0, 4).toString(), 'RIFF');
  });

  it('should support OPTIONS CORS preflight on tile endpoint', async () => {
    const res = await ctx.req(`/v1/tiles/aerial/NZTM2000Quad/16/33757/30417.webp?api=${ctx.apiKey}`, {
      method: 'OPTIONS',
      headers: ctx.Cors,
    });
    assert.equal(res.status, 200, res.statusText);
    assertCors(res);
  });

  it('should serve a tile as WebMercatorQuad', async () => {
    const res = await ctx.req(`/v1/tiles/aerial/WebMercatorQuad/17/129506/80410.webp?api=${ctx.apiKey}`);
    assert.equal(res.status, 200, res.statusText);
    assertCors(res);

    const body = Buffer.from(await res.arrayBuffer());
    assert.equal(body.subarray(0, 4).toString(), 'RIFF');
  });

  it('should serve a vector tile with CORS', async () => {
    const res = await ctx.req(`/v1/tiles/topographic/WebMercatorQuad/15/32267/19905.pbf?api=${ctx.apiKey}`, {
      headers: ctx.Cors,
    });
    assert.equal(res.status, 200, res.statusText);
    assertCors(res);
  });

  it('should support OPTIONS CORS preflight on vector tile endpoint', async () => {
    const res = await ctx.req(`/v1/tiles/topographic/WebMercatorQuad/15/32267/19905.pbf?api=${ctx.apiKey}`, {
      method: 'OPTIONS',
      headers: ctx.Cors,
    });
    assert.equal(res.status, 200, res.statusText);
    assertCors(res);
  });

  it('should serve a png tile', async () => {
    const res = await ctx.req(`/v1/tiles/aerial/WebMercatorQuad/6/62/40.png?api=${ctx.apiKey}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/png');
    assertCors(res);
  });

  it('should serve a jpeg tile', async () => {
    const res = await ctx.req(`/v1/tiles/aerial/WebMercatorQuad/6/62/40.jpeg?api=${ctx.apiKey}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/jpeg');
    assertCors(res);
  });

  it('should serve a avif tile', async () => {
    const res = await ctx.req(`/v1/tiles/aerial/WebMercatorQuad/6/62/40.avif?api=${ctx.apiKey}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/avif');
    assertCors(res);
  });

  it('should serve a jpg tile', async () => {
    const res = await ctx.req(`/v1/tiles/aerial/WebMercatorQuad/6/62/40.jpg?api=${ctx.apiKey}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'image/jpeg');
    assertCors(res);
  });

  it('should serve a preview', async () => {
    const res = await ctx.req(`/v1/preview/aerial/WebMercatorQuad/7.25/175.4665236/-41.1619890`);
    assert.equal(res.status, 200, res.statusText);

    const body = Buffer.from(await res.arrayBuffer());
    assert.equal(body.subarray(0, 4).toString(), 'RIFF');
  });
});
