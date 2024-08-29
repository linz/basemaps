import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { StyleJson } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import { Env } from '@basemaps/shared';

import { convertRelativeUrl, setStyleUrls } from '../routes/tile.style.json.js';

describe('TileStyleJson', () => {
  const host = 'https://tiles.test';
  let originalHost: string | undefined;
  beforeEach(() => {
    originalHost = process.env[Env.PublicUrlBase];
    process.env[Env.PublicUrlBase] = host;
  });

  afterEach(() => {
    process.env[Env.PublicUrlBase] = originalHost;
  });

  it('should not convert empty urls', () => {
    assert.equal(convertRelativeUrl(), '');
    assert.equal(convertRelativeUrl(''), '');
    assert.equal(convertRelativeUrl(undefined), '');
  });

  it('should only convert relative urls', () => {
    assert.equal(convertRelativeUrl('/foo'), 'https://tiles.test/foo');
    assert.equal(convertRelativeUrl('/bar/baz/'), 'https://tiles.test/bar/baz/');
  });

  it('should only convert with api keys', () => {
    assert.equal(convertRelativeUrl('/foo', undefined, 'abc'), 'https://tiles.test/foo?api=abc');
    assert.equal(convertRelativeUrl('/bar/baz/', undefined, 'abc'), 'https://tiles.test/bar/baz/?api=abc');
  });

  it('should convert with other query params', () => {
    assert.equal(convertRelativeUrl('/foo?bar=baz', undefined, 'abc'), 'https://tiles.test/foo?bar=baz&api=abc');
  });

  it('should not convert full urls', () => {
    assert.equal(convertRelativeUrl('https://foo.com/foo?bar=baz', undefined, 'abc'), 'https://foo.com/foo?bar=baz');
  });

  it('should update tileMatrix if exists', () => {
    assert.equal(
      convertRelativeUrl('/{tileMatrix}/{z}/{x}/{y}.webp', GoogleTms),
      'https://tiles.test/WebMercatorQuad/{z}/{x}/{y}.webp',
    );
    assert.equal(
      convertRelativeUrl('/{tileMatrix}/{z}/{x}/{y}.webp', Nztm2000QuadTms),
      'https://tiles.test/NZTM2000Quad/{z}/{x}/{y}.webp',
    );
    assert.equal(
      convertRelativeUrl('/WebMercatorQuad/{z}/{x}/{y}.webp'),
      'https://tiles.test/WebMercatorQuad/{z}/{x}/{y}.webp',
    );
  });

  const baseStyleJson: StyleJson = {
    version: 8,
    id: 'style.id',
    name: 'style.name',
    sources: {
      vector: { type: 'vector', url: '/v1/tiles/topographic/{tileMatrix}/tile.json' },
      raster: { type: 'raster', tiles: ['/v1/tiles/aerial/{tileMatrix}/{z}/{x}/{y}.webp'] },
      terrain: { type: 'raster-dem', tiles: ['/v1/tiles/elevation/{tileMatrix}/{z}/{x}/{y}.png'] },
    },
    layers: [],
    metadata: {},
    glyphs: '/v1/glyphs',
    sprite: '/v1/sprites',
  };

  it('should not destroy the original configuration', () => {
    const apiKey = 'abc123';
    const converted = structuredClone(baseStyleJson);
    setStyleUrls(converted, GoogleTms, apiKey, null);

    assert.deepEqual(converted.sources['vector'], {
      type: 'vector',
      url: 'https://tiles.test/v1/tiles/topographic/WebMercatorQuad/tile.json?api=abc123',
    });
    assert.deepEqual(converted.sources['raster'], {
      type: 'raster',
      tiles: ['https://tiles.test/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=abc123'],
    });
    assert.deepEqual(converted.sources['terrain'], {
      type: 'raster-dem',
      tiles: ['https://tiles.test/v1/tiles/elevation/WebMercatorQuad/{z}/{x}/{y}.png?api=abc123'],
    });

    assert.equal(JSON.stringify(baseStyleJson).includes(apiKey), false);

    const convertedB = structuredClone(baseStyleJson);

    setStyleUrls(convertedB, GoogleTms, '0x1234', null);
    assert.deepEqual(convertedB.sources['vector'], {
      type: 'vector',
      url: 'https://tiles.test/v1/tiles/topographic/WebMercatorQuad/tile.json?api=0x1234',
    });
    assert.deepEqual(convertedB.sources['raster'], {
      type: 'raster',
      tiles: ['https://tiles.test/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=0x1234'],
    });
    assert.deepEqual(convertedB.sources['terrain'], {
      type: 'raster-dem',
      tiles: ['https://tiles.test/v1/tiles/elevation/WebMercatorQuad/{z}/{x}/{y}.png?api=0x1234'],
    });

    assert.equal(JSON.stringify(baseStyleJson).includes('0x1234'), false);
    assert.equal(JSON.stringify(baseStyleJson).includes(apiKey), false);
    assert.equal(JSON.stringify(baseStyleJson).includes('?api='), false);
  });

  const rasterStyleJson: StyleJson = {
    version: 8,
    id: 'style.id',
    name: 'style.name',
    sources: {
      raster: { type: 'raster', tiles: ['/v1/tiles/aerial/{tileMatrix}/{z}/{x}/{y}.webp'] },
      terrain: { type: 'raster-dem', tiles: ['/v1/tiles/elevation/{tileMatrix}/{z}/{x}/{y}.png'] },
    },
    layers: [],
  };

  it('should cover raster style Json without metadata, sprite and glyphs', () => {
    const apiKey = 'abc123';
    const converted = structuredClone(rasterStyleJson);
    setStyleUrls(rasterStyleJson, GoogleTms, apiKey, null);

    assert.equal(converted.metadata, null);
    assert.equal(converted.sprite, null);
    assert.equal(converted.sprite, null);
  });

  it('should cover for raster styles for NZTM2000Quad', () => {
    const rasterStyleJson: StyleJson = {
      ...baseStyleJson,
      sources: {
        raster: { type: 'raster', tiles: ['/v1/tiles/aerial/{tileMatrix}/{z}/{x}/{y}.webp'] },
        terrain: { type: 'raster-dem', tiles: ['/v1/tiles/elevation/{tileMatrix}/{z}/{x}/{y}.png'] },
      },
    };

    const converted = structuredClone(rasterStyleJson);
    setStyleUrls(rasterStyleJson, Nztm2000QuadTms, 'abc123', null);

    assert.deepEqual(converted.sources['raster'], {
      type: 'raster',
      tiles: ['https://tiles.test/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.webp?api=abc123'],
    });
    assert.deepEqual(converted.sources['terrain'], {
      type: 'raster-dem',
      tiles: ['https://tiles.test/v1/tiles/elevation/NZTM2000Quad/{z}/{x}/{y}.png?api=abc123'],
    });
  });

  it('should convert relative glyphs and sprites', () => {
    const apiKey = '0x9f9f';
    const converted = structuredClone(baseStyleJson);

    setStyleUrls(baseStyleJson, GoogleTms, apiKey, null);
    assert.equal(converted.sprite, 'https://tiles.test/v1/sprites');
    assert.equal(converted.glyphs, 'https://tiles.test/v1/glyphs');

    assert.equal(JSON.stringify(baseStyleJson).includes(apiKey), false);
    assert.equal(JSON.stringify(baseStyleJson).includes('?api='), false);
  });

  it('should convert with config', () => {
    const apiKey = '0x9f9f';
    const converted = structuredClone(baseStyleJson);

    setStyleUrls(baseStyleJson, GoogleTms, apiKey, 'config.json');
    assert.equal(converted.sprite, 'https://tiles.test/v1/sprites?config=config.json');
    assert.equal(converted.glyphs, 'https://tiles.test/v1/glyphs?config=config.json');

    assert.deepEqual(converted.sources['vector'], {
      type: 'vector',
      url: 'https://tiles.test/v1/tiles/topographic/WebMercatorQuad/tile.json?api=0x9f9f&config=config.json',
    });
    assert.deepEqual(converted.sources['raster'], {
      type: 'raster',
      tiles: ['https://tiles.test/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.webp?api=0x9f9f&config=config.json'],
    });
  });
});
