import assert from 'node:assert';
import { describe, it } from 'node:test';

import { StyleJson } from '@basemaps/config';

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

  it('should convert min/maxzooms', () => {
    const newStyle = convertStyleToNztmStyle({
      ...fakeStyle,
      layers: [{ minzoom: 5, maxzoom: 10, id: 'something', type: '' }],
    });

    assert.deepEqual(newStyle.layers[0], { minzoom: 3, maxzoom: 8, id: 'something', type: '' });
  });

  it('should offset terrain', () => {
    const newStyle = convertStyleToNztmStyle({
      ...fakeStyle,
      terrain: { exaggeration: 1.1, source: 'abc' },
    });

    assert.deepEqual(newStyle.terrain, { exaggeration: 4.4, source: 'abc' });
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
