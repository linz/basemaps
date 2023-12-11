import assert from 'node:assert';
import { describe, it } from 'node:test';

import { MultiPolygon, Polygon, Ring } from '../../types.js';
import { Area } from '../area.js';

describe('Area', () => {
  it('Ring', () => {
    const ring: Ring = [
      [10, 10],
      [20, 10],
      [20, 20],
      [10, 20],
      [10, 10],
    ];
    const area = Area.ring(ring);
    assert.equal(area, 100);
  });
  it('Polygon, single exterior ring', () => {
    const poly: Polygon = [
      [
        [10, 10],
        [20, 10],
        [20, 20],
        [10, 20],
        [10, 10],
      ],
    ];
    const area = Area.polygon(poly);
    assert.equal(area, 100);
  });
  it('Polygon, interior rings', () => {
    const poly: Polygon = [
      [
        [10, 10],
        [20, 10],
        [20, 20],
        [10, 20],
        [10, 10],
      ],
      [
        [12, 14],
        [12, 18],
        [16, 18],
        [16, 14],
        [12, 14],
      ],
      [
        [16, 12],
        [16, 14],
        [18, 14],
        [18, 12],
        [16, 12],
      ],
    ];
    const area = Area.polygon(poly);
    assert.equal(area, 80);
  });
  it('MultiPolygon', () => {
    const multipoly: MultiPolygon = [
      [
        [
          [10, 10],
          [20, 10],
          [20, 20],
          [10, 20],
          [10, 10],
        ],
        [
          [12, 14],
          [12, 18],
          [16, 18],
          [16, 14],
          [12, 14],
        ],
        [
          [16, 12],
          [16, 14],
          [18, 14],
          [18, 12],
          [16, 12],
        ],
      ],
      [
        [
          [20, 10],
          [30, 10],
          [30, 20],
          [20, 20],
          [20, 10],
        ],
      ],
    ];
    const area = Area.multiPolygon(multipoly);
    assert.equal(area, 180);
  });
});
