import { Approx } from '@basemaps/test';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { Bounds } from '../bounds.js';

const TILE_SIZE = 256;
function getTile(x = 0, y = 0): Bounds {
    return new Bounds(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

o.spec('Bounds', () => {
    const tileZero = getTile(0, 0);
    const tileMiddle = new Bounds(128, 128, 256, 256);

    o('round', () => {
        o(new Bounds(1.1, 10.1, 12.2, 11.2).round().toJson()).deepEquals({ x: 1, y: 10, width: 12, height: 11 });
        o(new Bounds(1.4, 10.6, 12.2, 11.4).round().toJson()).deepEquals({ x: 1, y: 11, width: 13, height: 11 });
        o(new Bounds(0.4, 0.6, 2.4, 1.6).round().toJson()).deepEquals({ x: 0, y: 1, width: 3, height: 1 });

        o(new Bounds(1.6, 10.6, 12.5, 11.5).round().toJson()).deepEquals({ x: 2, y: 11, width: 12, height: 11 });
        o(new Bounds(1.6, 10.6, 12.5, 11.5).round(0.2).toJson()).deepEquals({ x: 1, y: 10, width: 13, height: 12 });
    });

    o('toBbox', () => {
        o(new Bounds(170, 40, 60, 45).toBbox()).deepEquals([170, 40, 230, 85]);
        o(new Bounds(10, -40, 60, -45).toBbox()).deepEquals([10, -40, 70, -85]);
    });

    o('intersects', () => {
        o(tileZero.intersects(tileZero)).equals(true);
        o(tileZero.intersects(new Bounds(0, 0, 10, 10))).equals(true);
        o(tileZero.intersects(new Bounds(-10, -10, 10, 10))).equals(false);
        o(tileZero.intersects(getTile(0, 1))).equals(false);
        o(tileZero.intersects(getTile(1, 0))).equals(false);
        o(tileZero.intersects(getTile(1, 1))).equals(false);
    });

    o('fromBbox', () => {
        Approx.bounds(Bounds.fromBbox([170, 40, 200, 45]), new Bounds(170, 40, 30, 5));
        Approx.bounds(Bounds.fromBbox([170, -30, 175, 40]), new Bounds(170, -30, 5, 70));
        Approx.bounds(Bounds.fromBbox([-170, -40, -155, -30]), new Bounds(-170, -40, 15, 10));
    });

    o('scaleFromCenter', () => {
        const b = Bounds.fromBbox([170, 40, 200, 45]);
        Approx.bounds(b.scaleFromCenter(1.2), new Bounds(167, 39.5, 36, 6));
        Approx.bounds(b.scaleFromCenter(0.5, 2), new Bounds(177.5, 37.5, 15, 10));
        Approx.bounds(b.scaleFromCenter(3, 0.25), new Bounds(140, 41.875, 90, 1.25));
    });

    o('pad', () => {
        const b = Bounds.fromBbox([170, 40, 200, 45]);
        o(round(b.pad(1.2).toBbox())).deepEquals([168.8, 38.8, 201.2, 46.2]);
        o(round(b.pad(0.5, 2).toBbox())).deepEquals([169.5, 38, 200.5, 47]);
        o(round(b.pad(-2).toBbox())).deepEquals([172, 42, 198, 43]);
    });

    o('intersects bounds', () => {
        o(tileZero.intersection(new Bounds(-10, -10, 10, 10))).equals(null);
        o(tileZero.intersection(getTile(0, 1))).equals(null);
        o(tileZero.intersection(getTile(1, 0))).equals(null);
        o(tileZero.intersection(getTile(1, 1))).equals(null);
        Approx.bounds(tileMiddle.intersection(getTile(0, 0)), new Bounds(128, 128, 128, 128));
        Approx.bounds(tileMiddle.intersection(getTile(1, 0)), new Bounds(256, 128, 128, 128));
        Approx.bounds(tileMiddle.intersection(getTile(1, 1)), new Bounds(256, 256, 128, 128));
        Approx.bounds(tileMiddle.intersection(getTile(0, 1)), new Bounds(128, 256, 128, 128));
    });

    o('union', () => {
        o(new Bounds(5, 10, 6, 7).union(new Bounds(2, 12, 1, 3)).toJson()).deepEquals(new Bounds(2, 10, 9, 7).toJson());
        o(new Bounds(5, 10, 6, 7).union(new Bounds(7, 2, 1, 3)).toJson()).deepEquals(new Bounds(5, 2, 6, 15).toJson());
        o(new Bounds(5, 10, 6, 7).union(new Bounds(2, 2, 20, 20)).toJson()).deepEquals(
            new Bounds(2, 2, 20, 20).toJson(),
        );

        o(new Bounds(2, 2, 20, 20).union(new Bounds(5, 10, 6, 7)).toJson()).deepEquals(
            new Bounds(2, 2, 20, 20).toJson(),
        );
    });

    o('static union', () => {
        o(Bounds.union([new Bounds(2, 12, 10, 30), { x: 1, y: -2, width: 3, height: 10 }]).toJson()).deepEquals({
            x: 1,
            y: -2,
            width: 11,
            height: 44,
        });
        o(
            Bounds.union([
                new Bounds(2, 12, 10, 30),
                { x: 4, y: 30, width: 3, height: 10 },
                { x: 10, y: 20, width: 40, height: 50 },
            ]).toJson(),
        ).deepEquals({ x: 2, y: 12, width: 48, height: 58 });
    });

    o('shift intersects', () => {
        o(tileZero.intersects(tileZero.subtract(tileZero))).equals(true);
        o(tileZero.intersects(tileZero.add(tileZero).subtract(tileZero))).equals(true);
        o(tileZero.intersects(tileZero.subtract(tileMiddle))).equals(true);
        o(tileZero.intersects(tileZero.add(tileMiddle))).equals(true);
    });

    o('containsBounds', () => {
        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 5.5, 0, 0))).equals(true);

        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4, 5.5, 0, 0))).equals(true);
        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 5, 0.2, 1))).equals(true);
        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(5, 5.5, 0, 0))).equals(true);
        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 6, 0, 0))).equals(true);
        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4, 5, 1, 1))).equals(true);

        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 6, 1, 0))).equals(false);
        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 6, 0.5, 1.001))).equals(false);

        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(3.9, 5.5, 0, 0))).equals(false);
        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 6.1, 0, 0))).equals(false);
        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 4.9, 0, 0))).equals(false);
        o(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(5.1, 5.5, 0, 0))).equals(false);
    });

    o('compareArea', () => {
        const { compareArea } = Bounds;
        o(compareArea(new Bounds(4, 5, 1, 1), new Bounds(4, 5, 1, 1))).equals(0);
        o(compareArea(new Bounds(3, 5, 1, 1), new Bounds(4, 5, 1, 1))).equals(-1);
        o(compareArea(new Bounds(4, 5, 1, 1), new Bounds(4, 4, 1, 1))).equals(1);

        o(compareArea(new Bounds(3, 5, 1, 1), new Bounds(3, 5, 2, 5))).equals(-9);
    });

    o('fromMultiPolygon', () => {
        const poly = [
            [
                [
                    [84, -49],
                    [74, -40],
                    [90, -57],
                    [94, -39],
                    [84, -49],
                ],
            ],
        ];

        o(Bounds.fromMultiPolygon(poly).toJson()).deepEquals({ x: 74, y: -57, width: 20, height: 18 });
    });

    o('toPolygon', () => {
        o(new Bounds(74, -57, 20, 18).toPolygon()).deepEquals([
            [
                [74, -57],
                [74, -39],
                [94, -39],
                [94, -57],
                [74, -57],
            ],
        ]);
    });
});
