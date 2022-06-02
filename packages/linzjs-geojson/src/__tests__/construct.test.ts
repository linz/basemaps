import o from 'ospec';
import { featuresToMultiPolygon, toFeatureMultiPolygon, toFeaturePolygon, toFeatureCollection } from '../construct.js';

o.spec('construct', () => {
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

  o('toFeatureCollection, toFeaturePolygon, toFeatureMultiPolygon, toPolygon', () => {
    const ans = toFeatureCollection([
      toFeatureMultiPolygon(coordinates, { tiff: '32.tiff' }),
      toFeaturePolygon(coordinates[0], { tiff: '31.tiff' }),
    ]);

    o(ans).deepEquals({
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

  o.spec('featuresToMultiPolygon', () => {
    o('keep holes', () => {
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

      o(ans).deepEquals({
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

    o('convert points, remove hoiles', () => {
      const features = [toFeaturePolygon([[[5, 6]], [[5, 7]]]), toFeatureMultiPolygon(coordinates)];
      const ans = featuresToMultiPolygon(features, true, (p) => [-p[1], -p[0]]);

      o(ans).deepEquals({
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
