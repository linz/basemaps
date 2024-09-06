import assert from 'node:assert';
import { describe, it } from 'node:test';

import { iterate } from '../iterate.js';
import { truncate } from '../truncate.js';
import { TestGeometries } from './iterate.test.js';

describe('truncate', () => {
  const fakeGeojson = { type: 'Feature', properties: {} } as const;

  for (const [name, geom] of Object.entries(TestGeometries)) {
    describe(name, () => {
      it(`should truncate ${name}`, () => {
        const geometry = structuredClone(geom);
        const json = { ...fakeGeojson, geometry } as GeoJSON.Feature;
        iterate(json, (pt) => {
          pt[0] = 1 + 1e-9;
          pt[1] = 1 - 1e-9;
        });

        truncate(json);

        // Validate every point has been truncated to 1 or -1
        assert.equal(
          geometry.coordinates.flat(100).every((f) => f === 1),
          true,
        );
      });

      it(`should not truncate less ${name} to than 8dp`, () => {
        const geometry = structuredClone(geom);
        const json = { ...fakeGeojson, geometry } as GeoJSON.Feature;
        iterate(json, (pt) => {
          pt[0] = 1.1;
          pt[1] = -1.1;
        });

        truncate(json);

        // Validate every point has been truncated to 1 or -1
        assert.equal(
          geometry.coordinates.flat(100).every((f) => f === 1.1 || f === -1.1),
          true,
        );
      });
    });
  }
});
