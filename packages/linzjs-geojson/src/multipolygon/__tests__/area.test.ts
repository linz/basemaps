import o from 'ospec';
import { MultiPolygon, Polygon, Ring } from '../../types.js';
import { Area } from '../area.js';

o.spec('Area', () => {
  o('Ring', () => {
    const ring: Ring = [
      [10, 10],
      [20, 10],
      [20, 20],
      [10, 20],
      [10, 10],
    ];
    const area = Area.ring(ring);
    o(area).equals(100);
  });
  o('Polygon, single exterior ring', () => {
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
    o(area).equals(100);
  });
  o('Polygon, interior rings', () => {
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
    o(area).equals(80);
  });
  o('MultiPolygon', () => {
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
    o(area).equals(180);
  });
});
