import { StyleJson } from '@basemaps/config';
import { Env } from '@basemaps/shared';
import o from 'ospec';
import { convertRelativeUrl, convertStyleJson } from '../routes/tile.style.json.js';

o.spec('TileStyleJson', () => {
  const host = 'https://tiles.test';
  let originalHost: string | undefined;
  o.beforeEach(() => {
    originalHost = process.env[Env.PublicUrlBase];
    process.env[Env.PublicUrlBase] = host;
  });

  o.afterEach(() => {
    process.env[Env.PublicUrlBase] = originalHost;
  });

  o('should not convert empty urls', () => {
    o(convertRelativeUrl()).equals('');
    o(convertRelativeUrl('')).equals('');
    o(convertRelativeUrl(undefined)).equals('');
  });

  o('should only convert relative urls', () => {
    o(convertRelativeUrl('/foo')).equals('https://tiles.test/foo');
    o(convertRelativeUrl('/bar/baz/')).equals('https://tiles.test/bar/baz/');
  });

  o('should only convert with api keys', () => {
    o(convertRelativeUrl('/foo', 'abc')).equals('https://tiles.test/foo?api=abc');
    o(convertRelativeUrl('/bar/baz/', 'abc')).equals('https://tiles.test/bar/baz/?api=abc');
  });

  o('should convert with other query params', () => {
    o(convertRelativeUrl('/foo?bar=baz', 'abc')).equals('https://tiles.test/foo?bar=baz&api=abc');
  });

  o('should not convert full urls', () => {
    o(convertRelativeUrl('https://foo.com/foo?bar=baz', 'abc')).equals('https://foo.com/foo?bar=baz');
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

  o('should not destroy the original configuration', () => {
    const apiKey = 'abc123';
    const converted = convertStyleJson(baseStyleJson, apiKey);

    console.log(converted);

    o(converted.sources.vector).deepEquals({
      type: 'vector',
      url: 'https://tiles.test/v1/tiles/topographic/EPSG:3857/tile.json?api=abc123',
    });
    o(converted.sources.raster).deepEquals({
      type: 'raster',
      tiles: ['https://tiles.test/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.webp?api=abc123'],
    });

    o(JSON.stringify(baseStyleJson).includes(apiKey)).equals(false);

    const convertedB = convertStyleJson(baseStyleJson, '0x1234');
    o(convertedB.sources.vector).deepEquals({
      type: 'vector',
      url: 'https://tiles.test/v1/tiles/topographic/EPSG:3857/tile.json?api=0x1234',
    });
    o(convertedB.sources.raster).deepEquals({
      type: 'raster',
      tiles: ['https://tiles.test/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.webp?api=0x1234'],
    });

    o(JSON.stringify(baseStyleJson).includes('0x1234')).equals(false);
  });

  o('should convert relative glyphs and sprites', () => {
    const apiKey = '0x9f9f';
    const converted = convertStyleJson(baseStyleJson, apiKey);
    o(converted.sprite).equals('https://tiles.test/v1/sprites');
    o(converted.glyphs).equals('https://tiles.test/v1/glyphs');

    o(JSON.stringify(baseStyleJson).includes(apiKey)).equals(false);
  });
});
