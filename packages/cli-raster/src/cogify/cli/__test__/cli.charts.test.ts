import assert from 'node:assert';
import { describe, it } from 'node:test';

import { FeatureCollection } from 'geojson';

import { geojsonToBbox } from '../cli.charts.js';

describe('geojsonToBbox', () => {
  it('should calculate bbox for a Polygon', () => {
    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [0, 10],
                [10, 10],
                [10, 0],
                [0, 0],
              ],
            ],
          },
        },
      ],
    };

    const bbox = geojsonToBbox(geojson);
    assert.deepEqual(bbox, [0, 0, 10, 10]);
  });

  it('should calculate intersection of two Polygons', () => {
    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [0, 10],
                [10, 10],
                [10, 0],
                [0, 0],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [5, 5],
                [5, 15],
                [15, 15],
                [15, 5],
                [5, 5],
              ],
            ],
          },
        },
      ],
    };

    const bbox = geojsonToBbox(geojson);
    assert.deepEqual(bbox, [0, 0, 15, 15]);
  });

  it('should calculate bbox for a MultiPolygon', () => {
    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [5, 5],
                  [5, 15],
                  [15, 15],
                  [15, 5],
                  [5, 5],
                ],
              ],
              [
                [
                  [0, 0],
                  [0, 10],
                  [10, 10],
                  [10, 0],
                  [0, 0],
                ],
              ],
            ],
          },
        },
      ],
    };

    const bbox = geojsonToBbox(geojson);
    assert.deepEqual(bbox, [0, 0, 15, 15]);
  });

  it('should throw for unsupported geometry type', () => {
    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [0, 0],
          },
        },
      ],
    };

    assert.throws(() => geojsonToBbox(geojson), /must contain Polygon or MultiPolygon/);
  });

  it('should throw if no features', () => {
    const geojson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [],
    };

    assert.throws(() => geojsonToBbox(geojson), /No union found in GeoJSON features/);
  });
});
