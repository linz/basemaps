/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Bounds } from '../bounds';
import * as o from 'ospec';

const TILE_SIZE = 256;
function getTile(x = 0, y = 0): Bounds {
    return new Bounds(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

o.spec('Bounds', (): void => {
    const tileZero = getTile(0, 0);
    const tileMiddle = new Bounds(128, 128, 256, 256);

    o('intersects', (): void => {
        o(tileZero.intersects(tileZero)).equals(true);
        o(tileZero.intersects(new Bounds(0, 0, 10, 10))).equals(true);
        o(tileZero.intersects(new Bounds(-10, -10, 10, 10))).equals(false);
        o(tileZero.intersects(getTile(0, 1))).equals(false);
        o(tileZero.intersects(getTile(1, 0))).equals(false);
        o(tileZero.intersects(getTile(1, 1))).equals(false);
    });

    o('intersects bounds', (): void => {
        o(tileZero.intersection(new Bounds(-10, -10, 10, 10))).equals(null);
        o(tileZero.intersection(getTile(0, 1))).equals(null);
        o(tileZero.intersection(getTile(1, 0))).equals(null);
        o(tileZero.intersection(getTile(1, 1))).equals(null);
        o(tileMiddle.intersection(getTile(0, 0))!.toJson()).deepEquals(new Bounds(128, 128, 128, 128).toJson());
        o(tileMiddle.intersection(getTile(1, 0))!.toJson()).deepEquals(new Bounds(256, 128, 128, 128).toJson());
        o(tileMiddle.intersection(getTile(1, 1))!.toJson()).deepEquals(new Bounds(256, 256, 128, 128).toJson());
        o(tileMiddle.intersection(getTile(0, 1))!.toJson()).deepEquals(new Bounds(128, 256, 128, 128).toJson());
    });

    o('shift intersects', (): void => {
        o(tileZero.intersects(tileZero.subtract(tileZero))).equals(true);
        o(tileZero.intersects(tileZero.add(tileZero).subtract(tileZero))).equals(true);
        o(tileZero.intersects(tileZero.subtract(tileMiddle))).equals(true);
        o(tileZero.intersects(tileZero.add(tileMiddle))).equals(true);
    });
});
