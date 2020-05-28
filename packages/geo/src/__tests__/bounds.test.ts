import * as o from 'ospec';
import { Bounds } from '../bounds';
import { approxBounds } from './test.util';

const TILE_SIZE = 256;
function getTile(x = 0, y = 0): Bounds {
    return new Bounds(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

o.spec('Bounds', () => {
    const tileZero = getTile(0, 0);
    const tileMiddle = new Bounds(128, 128, 256, 256);

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
        approxBounds(Bounds.fromBbox([170, 40, -160, 45]), new Bounds(170, 40, 30, 5));
        approxBounds(Bounds.fromBbox([170, 40, 175, -30]), new Bounds(170, 40, 5, 70));
        approxBounds(Bounds.fromBbox([-170, -40, -155, -30]), new Bounds(-170, -40, 15, 10));
    });

    o('scaleFromCenter', () => {
        const b = Bounds.fromBbox([170, 40, -160, 45]);
        approxBounds(b.scaleFromCenter(1.2), new Bounds(167, 39.5, 36, 6));
        approxBounds(b.scaleFromCenter(0.5, 2), new Bounds(177.5, 37.5, 15, 10));
        approxBounds(b.scaleFromCenter(3, 0.25), new Bounds(140, 41.875, 90, 1.25));
    });

    o('intersects bounds', () => {
        o(tileZero.intersection(new Bounds(-10, -10, 10, 10))).equals(null);
        o(tileZero.intersection(getTile(0, 1))).equals(null);
        o(tileZero.intersection(getTile(1, 0))).equals(null);
        o(tileZero.intersection(getTile(1, 1))).equals(null);
        approxBounds(tileMiddle.intersection(getTile(0, 0)), new Bounds(128, 128, 128, 128));
        approxBounds(tileMiddle.intersection(getTile(1, 0)), new Bounds(256, 128, 128, 128));
        approxBounds(tileMiddle.intersection(getTile(1, 1)), new Bounds(256, 256, 128, 128));
        approxBounds(tileMiddle.intersection(getTile(0, 1)), new Bounds(128, 256, 128, 128));
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
});
