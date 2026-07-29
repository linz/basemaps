import assert from 'node:assert';
import { describe, it } from 'node:test';

import ulid from 'ulid';

import { assertCacheHit, assertCacheMiss, ctx } from './base.js';

describe('cache policies', () => {
  describe('/v1* caching (v1CachePolicy)', () => {
    it('should hit cache on repeated request', async () => {
      const path = `/v1/fonts.json?api=${ctx.apiKey}`;
      const res1 = await ctx.req(path);
      assert.equal(res1.status, 200);

      const res2 = await ctx.req(path);
      assert.equal(res2.status, 200);
      assertCacheHit(res2);
    });

    it('should ignore query params not in v1CachePolicy allowList', async () => {
      const testId = ulid.ulid().toLowerCase();
      // v1CachePolicy allowList is ['config', 'exclude', 'pipeline']
      // Unallowed query param (e.g. 'testKey') should be ignored in cache key
      const res1 = await ctx.req(`/v1/fonts.json?api=${ctx.apiKey}&testKey=${testId}_1`);
      assert.equal(res1.status, 200);

      const res2 = await ctx.req(`/v1/fonts.json?api=${ctx.apiKey}&testKey=${testId}_2`);
      assert.equal(res2.status, 200);
      assertCacheHit(res2);
    });

    it('should include query params in v1CachePolicy allowList in cache key', async () => {
      const testId1 = ulid.ulid().toLowerCase();
      const testId2 = ulid.ulid().toLowerCase();
      // 'config' is in v1CachePolicy allowList so varying config produces different cache keys
      const configUrl1 = `s3://linz-basemaps/config/config-latest.json.gz?v=${testId1}`;
      const configUrl2 = `s3://linz-basemaps/config/config-latest.json.gz?v=${testId2}`;

      const res1 = await ctx.req(`/v1/fonts.json?api=${ctx.apiKey}&config=${encodeURIComponent(configUrl1)}`);
      assert.equal(res1.status, 200);

      const res2 = await ctx.req(`/v1/fonts.json?api=${ctx.apiKey}&config=${encodeURIComponent(configUrl2)}`);
      assert.equal(res2.status, 200);
      assertCacheMiss(res2);
    });

    interface TestStyle {
      glyphs?: string;
      sprite?: string;
      layers?: Array<{ id: string }>;
      sources?: Record<string, { url?: string; tiles?: string[] }>;
    }

    it('should validate config parameter on /v1/styles/topographic.json', async () => {
      const configUrl = 's3://linz-basemaps/config/config-latest.json.gz';
      const testId = ulid.ulid().toLowerCase();

      const res1 = await ctx.req(`/v1/styles/topographic.json?api=${ctx.apiKey}&config=${encodeURIComponent(configUrl)}`);
      assert.equal(res1.status, 200);

      const style1 = (await res1.json()) as TestStyle;
      assert.ok(style1.glyphs?.includes('config='), 'glyphs should include config');
      assert.ok(style1.sprite?.includes('config='), 'sprite should include config');
      assert.ok(style1.sources?.['LINZ Basemaps']?.url?.includes('config='), 'source url should include config');

      const configUrl2 = `${configUrl}?v=${testId}`;
      const res2 = await ctx.req(
        `/v1/styles/topographic.json?api=${ctx.apiKey}&config=${encodeURIComponent(configUrl2)}`,
      );
      assert.equal(res2.status, 200);
      assertCacheMiss(res2);
    });

    it('should validate exclude parameter on /v1/styles/topographic.json', async () => {
      const testId = ulid.ulid().toLowerCase();

      const res1 = await ctx.req(`/v1/styles/topographic.json?api=${ctx.apiKey}&exclude=background`);
      assert.equal(res1.status, 200);

      const style1 = (await res1.json()) as TestStyle;
      const hasBackgroundLayer = style1.layers?.some((layer: { id: string }) => layer.id === 'background');
      assert.equal(hasBackgroundLayer, false, 'background layer should be excluded');

      const res2 = await ctx.req(`/v1/styles/topographic.json?api=${ctx.apiKey}&exclude=${testId}`);
      assert.equal(res2.status, 200);
      assertCacheMiss(res2);
    });

    it('should validate pipeline parameter on /v1/styles/elevation.json', async () => {
      const res1 = await ctx.req(`/v1/styles/elevation.json?api=${ctx.apiKey}&pipeline=color-ramp`);
      assert.equal(res1.status, 200);

      const style1 = (await res1.json()) as TestStyle;
      const tiles = style1.sources?.['basemaps-elevation-color-ramp']?.tiles;
      assert.ok(
        tiles && tiles.some((t: string) => t.includes('pipeline=color-ramp')),
        'tiles should include pipeline=color-ramp',
      );

      const res2 = await ctx.req(`/v1/styles/elevation.json?api=${ctx.apiKey}&pipeline=terrain-rgb`);
      assert.equal(res2.status, 200);
      assertCacheMiss(res2);
    });

    it('should validate format parameter and default no labels on /v1/styles/elevation.json', async () => {
      const res = await ctx.req(`/v1/styles/elevation.json?api=${ctx.apiKey}&pipeline=color-ramp&format=webp`);
      assert.equal(res.status, 200);

      const style = (await res.json()) as TestStyle;

      const tiles = style.sources?.['basemaps-elevation-color-ramp']?.tiles;
      assert.ok(
        tiles && tiles.some((t: string) => t.includes('.webp')),
        'color-ramp tiles should be formatted as webp',
      );
      assert.equal(style.layers?.length, 1, 'default elevation style should have no labels');
      assert.equal(
        style.sources?.['LINZ Basemaps'],
        undefined,
        'default elevation style should not include LINZ Basemaps vector source',
      );
    });
  });

  describe('/@* caching (atCachePolicy)', () => {
    it('should hit cache on repeated request', async () => {
      const path = '/@-43.7302848,171.7870060,z10.37';
      const res1 = await ctx.req(path);
      assert.equal(res1.status, 200);

      const res2 = await ctx.req(path);
      assert.equal(res2.status, 200);
      assertCacheHit(res2);
    });

    it('should ignore query params not in atCachePolicy allowList', async () => {
      const testId = ulid.ulid().toLowerCase();
      // atCachePolicy allowList is ['config', 'exclude', 'tileMatrix', 'style', 'pipeline', 'terrain']
      // Unallowed query param (e.g. 'testKey') should be ignored in cache key
      const res1 = await ctx.req(`/@-43.7302848,171.7870060,z10.37?testKey=${testId}_1`);
      assert.equal(res1.status, 200);

      const res2 = await ctx.req(`/@-43.7302848,171.7870060,z10.37?testKey=${testId}_2`);
      assert.equal(res2.status, 200);
      assertCacheHit(res2);
    });

    it('should include query params in atCachePolicy allowList in cache key', async () => {
      const testId1 = ulid.ulid().toLowerCase();
      const testId2 = ulid.ulid().toLowerCase();
      // 'config' is in atCachePolicy allowList so varying config produces different cache keys
      const configUrl1 = `s3://linz-basemaps/config/config-latest.json.gz?v=${testId1}`;
      const configUrl2 = `s3://linz-basemaps/config/config-latest.json.gz?v=${testId2}`;

      const res1 = await ctx.req(`/@-43.7302848,171.7870060,z10.37?config=${encodeURIComponent(configUrl1)}`);
      assert.equal(res1.status, 200);

      const res2 = await ctx.req(`/@-43.7302848,171.7870060,z10.37?config=${encodeURIComponent(configUrl2)}`);
      assert.equal(res2.status, 200);
      assertCacheMiss(res2);
    });
  });

  describe('default root caching', () => {
    it('should hit cache on repeated request for index.html', async () => {
      const res1 = await ctx.req('/index.html');
      assert.equal(res1.status, 200);

      const res2 = await ctx.req('/index.html');
      assert.equal(res2.status, 200);
      assertCacheHit(res2);
    });
  });
});
