import * as o from 'ospec';
import 'source-map-support/register';
import { Bounds } from '../bounds';

const TILE_SIZE = 256;
function getTile(x = 0, y = 0): Bounds {
    return new Bounds(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function assertNear(a: number, b: number, esp = 1e-4): void {
    if (Math.abs(b - a) < esp) o(true).equals(true);
    else o(a).equals(b);
}

function assertBounds(b: Bounds, exp: any, esp = 1e-4): void {
    assertNear(b.x, exp.x, esp);
    assertNear(b.y, exp.y, esp);
    assertNear(b.width, exp.width, esp);
    assertNear(b.height, exp.height, esp);
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
        assertBounds(Bounds.fromBbox([170, 40, -160, 45]), new Bounds(170, 40, 30, 5));
        assertBounds(Bounds.fromBbox([170, 40, 175, -30]), new Bounds(170, 40, 5, 70));
        assertBounds(Bounds.fromBbox([-170, -40, -155, -30]), new Bounds(-170, -40, 15, 10));
    });

    o('scaleFromCenter', () => {
        const b = Bounds.fromBbox([170, 40, -160, 45]);
        assertBounds(b.scaleFromCenter(1.2), new Bounds(167, 39.5, 36, 6));
        assertBounds(b.scaleFromCenter(0.5, 2), new Bounds(177.5, 37.5, 15, 10));
        assertBounds(b.scaleFromCenter(3, 0.25), new Bounds(140, 41.875, 90, 1.25));
    });

    o('intersects bounds', () => {
        o(tileZero.intersection(new Bounds(-10, -10, 10, 10))).equals(null);
        o(tileZero.intersection(getTile(0, 1))).equals(null);
        o(tileZero.intersection(getTile(1, 0))).equals(null);
        o(tileZero.intersection(getTile(1, 1))).equals(null);
        o(tileMiddle.intersection(getTile(0, 0))!.toJson()).deepEquals(new Bounds(128, 128, 128, 128).toJson());
        o(tileMiddle.intersection(getTile(1, 0))!.toJson()).deepEquals(new Bounds(256, 128, 128, 128).toJson());
        o(tileMiddle.intersection(getTile(1, 1))!.toJson()).deepEquals(new Bounds(256, 256, 128, 128).toJson());
        o(tileMiddle.intersection(getTile(0, 1))!.toJson()).deepEquals(new Bounds(128, 256, 128, 128).toJson());
    });

    o('shift intersects', () => {
        o(tileZero.intersects(tileZero.subtract(tileZero))).equals(true);
        o(tileZero.intersects(tileZero.add(tileZero).subtract(tileZero))).equals(true);
        o(tileZero.intersects(tileZero.subtract(tileMiddle))).equals(true);
        o(tileZero.intersects(tileZero.add(tileMiddle))).equals(true);
    });
});
