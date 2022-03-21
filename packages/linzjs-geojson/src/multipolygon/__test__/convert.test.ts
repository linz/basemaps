import o from 'ospec';
import { MultiPolygon } from '../../types.js';
import { multiPolygonToWgs84 } from '../convert.js';

function intToWgs84(from: number[]): [number, number] {
  const lon = from[0] * 0.1 + 174.5;
  return [lon > 180 ? lon - 360 : lon, from[1] * 0.05 + -40.8];
}

o.spec('convert', () => {
  o.spec('multiPolygonToWgs84', () => {
    o('simple', () => {
      const poly: MultiPolygon = [
        [
          [
            [0, 1],
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
        ],
      ];

      const ans = multiPolygonToWgs84(poly, intToWgs84);

      o(ans).deepEquals([
        [
          [
            [174.5, -40.75],
            [174.5, -40.8],
            [174.6, -40.8],
            [174.6, -40.75],
            [174.5, -40.75],
          ],
        ],
      ]);
    });

    o('crosses antimeridian', () => {
      const poly: MultiPolygon = [
        [
          [
            [0, 1],
            [0, 0],
            [100, 0],
            [100, 1],
            [0, 1],
          ],
        ],
      ];

      const ans = multiPolygonToWgs84(poly, intToWgs84);

      o(ans).deepEquals([
        [
          [
            [174.5, -40.8],
            [180, -40.8],
            [180, -40.75],
            [174.5, -40.75],
            [174.5, -40.8],
          ],
        ],
        [
          [
            [-180, -40.8],
            [-175.5, -40.8],
            [-175.5, -40.75],
            [-180, -40.75],
            [-180, -40.8],
          ],
        ],
      ]);
    });
  });
});
