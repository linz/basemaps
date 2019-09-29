/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Bounds } from '../bounds';
const TILE_SIZE = 256;
function getTile(x = 0, y = 0): Bounds {
    return new Bounds(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

describe('Bounds', () => {
    const tileZero = getTile(0, 0);
    const tileMiddle = new Bounds(128, 128, 256, 256);

    it('intersects', () => {
        expect(tileZero.intersects(tileZero)).toEqual(true);
        expect(tileZero.intersects(new Bounds(0, 0, 10, 10))).toEqual(true);
        expect(tileZero.intersects(new Bounds(-10, -10, 10, 10))).toEqual(false);
        expect(tileZero.intersects(getTile(0, 1))).toEqual(false);
        expect(tileZero.intersects(getTile(1, 0))).toEqual(false);
        expect(tileZero.intersects(getTile(1, 1))).toEqual(false);
    });

    it('intersects bounds', () => {
        expect(tileZero.intersection(new Bounds(-10, -10, 10, 10))).toEqual(null);
        expect(tileZero.intersection(getTile(0, 1))).toEqual(null);
        expect(tileZero.intersection(getTile(1, 0))).toEqual(null);
        expect(tileZero.intersection(getTile(1, 1))).toEqual(null);
        expect(tileMiddle.intersection(getTile(0, 0))!.toJson()).toEqual(new Bounds(128, 128, 128, 128).toJson());
        expect(tileMiddle.intersection(getTile(1, 0))!.toJson()).toEqual(new Bounds(256, 128, 128, 128).toJson());
        expect(tileMiddle.intersection(getTile(1, 1))!.toJson()).toEqual(new Bounds(256, 256, 128, 128).toJson());
        expect(tileMiddle.intersection(getTile(0, 1))!.toJson()).toEqual(new Bounds(128, 256, 128, 128).toJson());
    });
});
