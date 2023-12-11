import assert from 'node:assert';
import { describe, it } from 'node:test';

import { featuresToMultiPolygon, toFeatureCollection, toFeatureMultiPolygon, toFeaturePolygon } from '../construct.js';

describe('construct', () => {
  const coordinates = [
    [
      [
        [1, 2],
        [1, 3],
      ],
    ],
    [
      [
        [3, 4],
        [3, 5],
      ],
      [[9, 10]],
    ],
  ];

  it('toFeatureCollection, toFeaturePolygon, toFeatureMultiPolygon, toPolygon', () => {
    const ans = toFeatureCollection([
      toFeatureMultiPolygon(coordinates, { tiff: '32.tiff' }),
      toFeaturePolygon(coordinates[0], { tiff: '31.tiff' }),
    ]);

    assert.deepEqual(ans, {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [1, 2],
                  [1, 3],
                ],
              ],
              [
                [
                  [3, 4],
                  [3, 5],
                ],
                [[9, 10]],
              ],
            ],
          },
          properties: { tiff: '32.tiff' },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [1, 2],
                [1, 3],
              ],
            ],
          },
          properties: { tiff: '31.tiff' },
        },
      ],
    });
  });

  describe('featuresToMultiPolygon', () => {
    it('keep holes', () => {
      const features = [
        toFeaturePolygon([
          [
            [5, 6],
            [5, 7],
          ],
        ]),
        toFeatureMultiPolygon(coordinates),
      ];
      const ans = featuresToMultiPolygon(features);

      assert.deepEqual(ans, {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [5, 6],
              [5, 7],
            ],
          ],
          [
            [
              [1, 2],
              [1, 3],
            ],
          ],
          [
            [
              [3, 4],
              [3, 5],
            ],
            [[9, 10]],
          ],
        ],
      });
    });

    it('convert points, remove holes', () => {
      const features = [toFeaturePolygon([[[5, 6]], [[5, 7]]]), toFeatureMultiPolygon(coordinates)];
      const ans = featuresToMultiPolygon(features, true, (p) => [-p[1], -p[0]]);

      assert.deepEqual(ans, {
        type: 'MultiPolygon',
        coordinates: [
          [[[-6, -5]]],
          [
            [
              [-2, -1],
              [-3, -1],
            ],
          ],
          [
            [
              [-4, -3],
              [-5, -3],
            ],
          ],
        ],
      });
    });
  });
});
