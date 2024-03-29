import assert from 'node:assert';
import { describe, it } from 'node:test';

import { round } from '@basemaps/test/build/rounding.js';

import { BBox, MultiPolygon } from '../../types.js';
import { clipMultipolygon } from '../clipped.js';

describe('clipped.multipolygon', () => {
  const polys: MultiPolygon = [
    [
      [
        [-4, 2],
        [-2, 1],
        [-4, -1],
        [1, -5],
        [2, -5],
        [2, -2],
        [4, -5],
        [6, -2],
        [2, 0],
        [6, 3],
        [2, 7],
        [0, 3],
        [-4, 6],
        [-4, 10],
        [10, 10],
        [10, -10],
        [-10, -10],
        [-4, 2],
      ],
    ],
    [
      [
        [2, 3],
        [3, 3],
        [3, 5],
        [2, 5],
        [2, 3],
      ],
    ],
  ];

  describe('clipMultipolygon', () => {
    it('disjoint with intersecting bounds', () => {
      const bbox: BBox = [-2, -2, 1, 1];

      const cp = clipMultipolygon(polys, bbox);

      assert.deepEqual(cp, []);
    });

    it('intersect', () => {
      const bbox: BBox = [-3, -4, 4, 4];

      const cp = clipMultipolygon(polys, bbox);

      assert.deepEqual(round(cp, 2), [
        [
          [
            [-3, -4],
            [-0.25, -4],
            [-3, -1.8],
            [-3, -4],
          ],
        ],
        [
          [
            [-3, 0],
            [-2, 1],
            [-3, 1.5],
            [-3, 0],
          ],
        ],
        [
          [
            [-1.33, 4],
            [0, 3],
            [0.5, 4],
            [-1.33, 4],
          ],
        ],
        [
          [
            [2, -4],
            [3.33, -4],
            [2, -2],
            [2, -4],
          ],
        ],
        [
          [
            [2, 0],
            [4, -1],
            [4, 1.5],
            [2, 0],
          ],
        ],
        [
          [
            [2, 3],
            [3, 3],
            [3, 4],
            [2, 4],
            [2, 3],
          ],
        ],
      ]);
    });
  });

  describe('removeDegenerateEdges', () => {
    it('simple', () => {
      const bbox: BBox = [-3, 1, 3, 3];

      const cp: MultiPolygon = [
        [
          [
            [-2, 2],
            [-1.5, 1],
            [-0.5, 1],
            [0, 2],
            [0.5, 1],
            [-2, 1],
            [-2, 2],
          ],
        ],
      ];

      const ans = clipMultipolygon(cp, bbox);

      assert.deepEqual(ans, [
        [
          [
            [-2, 1],
            [-1.5, 1],
            [-2, 2],
            [-2, 1],
          ],
        ],
        [
          [
            [-0.5, 1],
            [0.5, 1],
            [0, 2],
            [-0.5, 1],
          ],
        ],
      ]);
    });

    it('three bumps', () => {
      const degen: MultiPolygon = [
        [
          [
            [0, 0],
            [159, 0],
            [462, -3547],
            [840, -3547],
            [838, -3500],
            [984, -3500],
            [992, -3547],
            [999, -3547],
            [1013, -3444],
            [1026, -3441],
            [1045, -3442],
            [1050, -3547],
            [-693, -3547],
            [-693, -3000],
            [-2367, -3000],
            [-2372, -3547],
            [-2513, -3547],
            [-2528, 0],
            [0, 0],
          ],
        ],
      ];

      const bbox: BBox = [-3000, -3547, 3000, 1000];

      const ans = clipMultipolygon(degen, bbox);

      assert.deepEqual(ans, [
        [
          [
            [-2528, 0],
            [-2513, -3547],
            [-2372, -3547],
            [-2367, -3000],
            [-693, -3000],
            [-693, -3547],
            [462, -3547],
            [159, 0],
            [-2528, 0],
          ],
        ],
        [
          [
            [838, -3500],
            [840, -3547],
            [992, -3547],
            [984, -3500],
            [838, -3500],
          ],
        ],
        [
          [
            [999, -3547],
            [1050, -3547],
            [1045, -3442],
            [1026, -3441],
            [1013, -3444],
            [999, -3547],
          ],
        ],
      ]);
    });

    it('loop', () => {
      const bbox: BBox = [0, 3, 10, 8];

      const orig: MultiPolygon = [
        [
          [
            [8, 6],
            [2, 6],
            [2, 1],
            [4, 1],
            [4, 4],
            [6, 4],
            [6, 1],
            [8, 1],
            [8, 6],
          ],
        ],
      ];

      const ans = clipMultipolygon(orig, bbox);

      assert.deepEqual(ans, [
        [
          [
            [2, 3],
            [4, 3],
            [4, 4],
            [6, 4],
            [6, 3],
            [8, 3],
            [8, 6],
            [2, 6],
            [2, 3],
          ],
        ],
      ]);
    });

    it('complex', () => {
      const bbox: BBox = [-3, -4, 4, 4];
      const ans = clipMultipolygon(polys, bbox);

      assert.deepEqual(round(ans, 2), [
        [
          [
            [-3, -4],
            [-0.25, -4],
            [-3, -1.8],
            [-3, -4],
          ],
        ],
        [
          [
            [-3, 0],
            [-2, 1],
            [-3, 1.5],
            [-3, 0],
          ],
        ],
        [
          [
            [-1.33, 4],
            [0, 3],
            [0.5, 4],
            [-1.33, 4],
          ],
        ],
        [
          [
            [2, -4],
            [3.33, -4],
            [2, -2],
            [2, -4],
          ],
        ],
        [
          [
            [2, 0],
            [4, -1],
            [4, 1.5],
            [2, 0],
          ],
        ],
        [
          [
            [2, 3],
            [3, 3],
            [3, 4],
            [2, 4],
            [2, 3],
          ],
        ],
      ]);
    });
  });
});
