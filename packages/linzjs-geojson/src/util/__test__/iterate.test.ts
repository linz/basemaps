import assert from 'node:assert';
import { describe, it } from 'node:test';

import { iterate } from '../iterate.js';

export const TestGeometries = {
  Point: { type: 'Point', coordinates: [0, 1] } as GeoJSON.Point,
  MultiPoint: {
    type: 'MultiPoint',
    coordinates: [
      [0, 1],
      [1, 2],
    ],
  } as GeoJSON.MultiPoint,
  Polygon: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 1],
        [1, 2],
      ],
      [
        [3, 4],
        [5, 6],
      ],
    ],
  } as GeoJSON.Polygon,
  MultiPolygon: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 1],
          [1, 2],
        ],
        [
          [3, 4],
          [5, 6],
        ],
      ],
    ],
  } as GeoJSON.MultiPolygon,
  LineString: {
    type: 'LineString',
    coordinates: [
      [0, 1],
      [1, 2],
    ],
  } as GeoJSON.LineString,
  MultiLineString: {
    type: 'MultiLineString',
    coordinates: [
      [
        [0, 1],
        [1, 2],
      ],
      [[1, 2]],
    ],
  } as GeoJSON.MultiLineString,
};

describe('iterate', () => {
  const fakeGeojson = { type: 'Feature', properties: {} } as const;

  for (const [name, geometry] of Object.entries(TestGeometries)) {
    describe(name, () => {
      it('should iterate a ' + name, (t) => {
        const cb = t.mock.fn();
        iterate({ ...fakeGeojson, geometry }, cb);
        const flatCoords = geometry.coordinates.flat(100);

        assert.equal(cb.mock.callCount(), flatCoords.length / 2);
        for (let i = 0; i < flatCoords.length; i += 2) {
          const coord = [flatCoords[i], flatCoords[i + 1]];
          assert.deepEqual(cb.mock.calls[i / 2].arguments[0], coord);
        }
      });
    });
  }
});
