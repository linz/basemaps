import assert from 'node:assert';
import { describe, it } from 'node:test';

import { StyleJson } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';

import { setStyleTerrain } from '../../routes/tile.style.json.js';
import { convertStyleToNztmStyle } from '../nztm.style.js';

describe('NZTM2000QuadStyle', () => {
  const fakeStyle: StyleJson = {
    version: 8,
    id: 'test',
    name: 'topographic',
    sources: {},
    layers: [],
    glyphs: '/glyphs',
    sprite: '/sprite',
    metadata: { id: 'test' },
  };

  it('should not modify the source style', () => {
    const baseStyle = {
      ...fakeStyle,
      terrain: { exaggeration: 1.1, source: 'abc' },
    };

    convertStyleToNztmStyle(baseStyle);
    assert.equal(baseStyle.terrain?.exaggeration, 1.1);
  });

  it('should convert min/maxzooms', () => {
    const newStyle = convertStyleToNztmStyle({
      ...fakeStyle,
      layers: [{ minzoom: 5, maxzoom: 10, id: 'something', type: '' }],
    });

    assert.deepEqual(newStyle.layers[0], { minzoom: 3, maxzoom: 8, id: 'something', type: '' });
  });

  it('should not offset terrain for WebMecator', () => {
    const testStyle: StyleJson = {
      ...fakeStyle,
      sources: { 'LINZ-Terrain': { type: 'raster-dem', tiles: ['https://example.com/{z}/{x}/{y}.png'] } },
    };
    setStyleTerrain(testStyle, 'LINZ-Terrain', GoogleTms);

    assert.deepEqual(testStyle.terrain, { exaggeration: 1.2, source: 'LINZ-Terrain' });
  });

  it('should offset terrain for NZTM', () => {
    const testStyle: StyleJson = {
      ...fakeStyle,
      sources: { 'LINZ-Terrain': { type: 'raster-dem', tiles: ['https://example.com/{z}/{x}/{y}.png'] } },
    };
    setStyleTerrain(testStyle, 'LINZ-Terrain', Nztm2000QuadTms);

    assert.deepEqual(testStyle.terrain, { exaggeration: 4.4, source: 'LINZ-Terrain' });
  });

  it('should convert stops inside of paint and layout', () => {
    const newStyle = convertStyleToNztmStyle({
      ...fakeStyle,
      layers: [
        {
          layout: {
            'line-width': {
              stops: [
                [16, 0.75],
                [24, 1.5],
              ],
            },
          },

          paint: {
            'line-width': {
              stops: [
                [16, 0.75],
                [24, 1.5],
              ],
            },
          },
          id: 'something',
          type: '',
        },
      ],
    });

    assert.deepEqual(newStyle.layers[0], {
      layout: {
        'line-width': {
          stops: [
            [14, 0.75],
            [22, 1.5],
          ],
        },
      },
      paint: {
        'line-width': {
          stops: [
            [14, 0.75],
            [22, 1.5],
          ],
        },
      },
      id: 'something',
      type: '',
    });
  });
});
