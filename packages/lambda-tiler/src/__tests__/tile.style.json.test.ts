import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { StyleJson } from '@basemaps/config';
import { Env } from '@basemaps/shared';

import { convertRelativeUrl, convertStyleJson } from '../routes/tile.style.json.js';

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
    assert.equal(convertRelativeUrl('/foo', 'abc'), 'https://tiles.test/foo?api=abc');
    assert.equal(convertRelativeUrl('/bar/baz/', 'abc'), 'https://tiles.test/bar/baz/?api=abc');
  });

  it('should convert with other query params', () => {
    assert.equal(convertRelativeUrl('/foo?bar=baz', 'abc'), 'https://tiles.test/foo?bar=baz&api=abc');
  });

  it('should not convert full urls', () => {
    assert.equal(convertRelativeUrl('https://foo.com/foo?bar=baz', 'abc'), 'https://foo.com/foo?bar=baz');
  });

  const baseStyleJson: StyleJson = {
    version: 8,
    id: 'style.id',
    name: 'style.name',
    sources: {
      vector: { type: 'vector', url: '/v1/tiles/topographic/EPSG:3857/tile.json' },
      raster: { type: 'raster', tiles: ['/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.webp'] },
    },
    layers: [],
    metadata: {},
    glyphs: '/v1/glyphs',
    sprite: '/v1/sprites',
  };

  it('should not destroy the original configuration', () => {
    const apiKey = 'abc123';
    const converted = convertStyleJson(baseStyleJson, apiKey, null);

    assert.deepEqual(converted.sources['vector'], {
      type: 'vector',
      url: 'https://tiles.test/v1/tiles/topographic/EPSG:3857/tile.json?api=abc123',
    });
    assert.deepEqual(converted.sources['raster'], {
      type: 'raster',
      tiles: ['https://tiles.test/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.webp?api=abc123'],
    });

    assert.equal(JSON.stringify(baseStyleJson).includes(apiKey), false);

    const convertedB = convertStyleJson(baseStyleJson, '0x1234', null);
    assert.deepEqual(convertedB.sources['vector'], {
      type: 'vector',
      url: 'https://tiles.test/v1/tiles/topographic/EPSG:3857/tile.json?api=0x1234',
    });
    assert.deepEqual(convertedB.sources['raster'], {
      type: 'raster',
      tiles: ['https://tiles.test/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.webp?api=0x1234'],
    });

    assert.equal(JSON.stringify(baseStyleJson).includes('0x1234'), false);
    assert.equal(JSON.stringify(baseStyleJson).includes(apiKey), false);
    assert.equal(JSON.stringify(baseStyleJson).includes('?api='), false);
  });

  it('should convert relative glyphs and sprites', () => {
    const apiKey = '0x9f9f';
    const converted = convertStyleJson(baseStyleJson, apiKey, null);
    assert.equal(converted.sprite, 'https://tiles.test/v1/sprites');
    assert.equal(converted.glyphs, 'https://tiles.test/v1/glyphs');

    assert.equal(JSON.stringify(baseStyleJson).includes(apiKey), false);
    assert.equal(JSON.stringify(baseStyleJson).includes('?api='), false);
  });

  it('should convert with config', () => {
    const apiKey = '0x9f9f';
    const converted = convertStyleJson(baseStyleJson, apiKey, 'config.json');
    assert.equal(converted.sprite, 'https://tiles.test/v1/sprites?config=config.json');
    assert.equal(converted.glyphs, 'https://tiles.test/v1/glyphs?config=config.json');

    assert.deepEqual(converted.sources['vector'], {
      type: 'vector',
      url: 'https://tiles.test/v1/tiles/topographic/EPSG:3857/tile.json?api=0x9f9f&config=config.json',
    });
    assert.deepEqual(converted.sources['raster'], {
      type: 'raster',
      tiles: ['https://tiles.test/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.webp?api=0x9f9f&config=config.json'],
    });
  });
});
