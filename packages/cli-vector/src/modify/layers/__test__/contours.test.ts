import { before, describe, it } from 'node:test';

import { strictEqual } from 'assert';

import { VectorGeoFeature, VectorGeoFeatureSchema } from '../../../types/VectorGeoFeature.js';
import { handleKindContours, handleKindPeak } from '../contours.js';

describe('HandleLayerContours', () => {
  const FakeFeature: VectorGeoFeature = {
    type: 'Feature',
    properties: {},
    tippecanoe: {
      layer: 'contours',
      minzoom: -1,
      maxzoom: -1,
    },
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [
          [-1, -1, -1],
          [-1, -1, -1],
        ],
      ],
    },
  };

  before(() => {
    VectorGeoFeatureSchema.parse(FakeFeature);
  });

  describe('handleKindContours', () => {
    it('should assign a feature a type of index', () => {
      const feature = structuredClone(FakeFeature);
      feature.properties['elevation'] = 100;

      const modifiedFeature = handleKindContours(feature);

      strictEqual(modifiedFeature.properties['type'], 'index');
      strictEqual(modifiedFeature.tippecanoe.minzoom, FakeFeature.tippecanoe.minzoom);
    });

    it("should override a feature's minzoom, but not assign it a type", () => {
      const feature = structuredClone(FakeFeature);
      feature.properties['elevation'] = 105;

      const modifiedFeature = handleKindContours(feature);

      strictEqual(modifiedFeature.properties['type'], undefined);
      strictEqual(modifiedFeature.tippecanoe.minzoom, 14);
    });
  });

  describe('handleKindPeak', () => {
    it('should assign a feature a rank from 1-5', () => {
      const cases = [
        { elevation: 2000, rank: 1 },
        { elevation: 1500, rank: 2 },
        { elevation: 1000, rank: 3 },
        { elevation: 500, rank: 4 },
        { elevation: 0, rank: 5 },
      ];

      for (const { elevation, rank } of cases) {
        const feature = structuredClone(FakeFeature);
        feature.properties['elevation'] = elevation;

        const modifiedFeature = handleKindPeak(feature);

        strictEqual(modifiedFeature.properties['rank'], rank);
      }
    });
  });
});
