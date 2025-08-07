import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { Epsg } from '@basemaps/geo';

import { mapEpsgToSlug } from '../../topo/slug.js';

describe('mapEpsgToSlug', () => {
  /**
   * valid tests
   */
  const validParameters = [
    { parameters: { mapSeries: 'topo25' as const, epsgCode: 3788 }, expected: 'topo25-snares-islands' },
    { parameters: { mapSeries: 'topo50' as const, epsgCode: 5479 }, expected: 'topo50-antarctic' },
    { parameters: { mapSeries: 'topo250' as const, epsgCode: 2193 }, expected: 'topo250-new-zealand-mainland' },
  ];

  it('should return the expected slug values', () => {
    for (const { parameters, expected } of validParameters) {
      const { mapSeries, epsgCode } = parameters;

      const epsg = Epsg.tryGet(epsgCode) ?? new Epsg(epsgCode);

      const slug = mapEpsgToSlug(mapSeries, epsg);
      strictEqual(slug, expected, 'Slug does not match');
    }
  });

  /**
   * invalid tests
   */
  const invalidParameters = [
    { parameters: { mapSeries: 'topo25' as const, epsgCode: 9999 } },
    { parameters: { mapSeries: 'topo50' as const, epsgCode: 9999 } },
    { parameters: { mapSeries: 'topo250' as const, epsgCode: 9999 } },
  ];

  it('should return null', () => {
    for (const { parameters } of invalidParameters) {
      const { mapSeries, epsgCode } = parameters;

      const epsg = Epsg.tryGet(epsgCode) ?? new Epsg(epsgCode);

      const slug = mapEpsgToSlug(mapSeries, epsg);
      strictEqual(slug, null, 'Result is not null');
    }
  });
});
