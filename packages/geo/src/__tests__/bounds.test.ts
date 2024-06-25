import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Approx } from '@basemaps/test';
import { round } from '@basemaps/test/build/rounding.js';

import { Bounds } from '../bounds.js';

const TILE_SIZE = 256;
function getTile(x = 0, y = 0): Bounds {
  return new Bounds(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

describe('Bounds', () => {
  const tileZero = getTile(0, 0);
  const tileMiddle = new Bounds(128, 128, 256, 256);

  it('round', () => {
    assert.deepEqual(new Bounds(1.1, 10.1, 12.2, 11.2).round().toJson(), { x: 1, y: 10, width: 12, height: 11 });
    assert.deepEqual(new Bounds(1.4, 10.6, 12.2, 11.4).round().toJson(), { x: 1, y: 11, width: 13, height: 11 });
    assert.deepEqual(new Bounds(0.4, 0.6, 2.4, 1.6).round().toJson(), { x: 0, y: 1, width: 3, height: 1 });

    assert.deepEqual(new Bounds(1.6, 10.6, 12.5, 11.5).round().toJson(), { x: 2, y: 11, width: 12, height: 11 });
    assert.deepEqual(new Bounds(1.6, 10.6, 12.5, 11.5).round(0.2).toJson(), { x: 1, y: 10, width: 13, height: 12 });
  });

  it('toBbox', () => {
    assert.deepEqual(new Bounds(170, 40, 60, 45).toBbox(), [170, 40, 230, 85]);
    assert.deepEqual(new Bounds(10, -40, 60, -45).toBbox(), [10, -40, 70, -85]);
  });

  it('intersects', () => {
    assert.equal(tileZero.intersects(tileZero), true);
    assert.equal(tileZero.intersects(new Bounds(0, 0, 10, 10)), true);
    assert.equal(tileZero.intersects(new Bounds(-10, -10, 10, 10)), false);
    assert.equal(tileZero.intersects(getTile(0, 1)), false);
    assert.equal(tileZero.intersects(getTile(1, 0)), false);
    assert.equal(tileZero.intersects(getTile(1, 1)), false);
  });

  it('fromBbox', () => {
    Approx.bounds(Bounds.fromBbox([170, 40, 200, 45]), new Bounds(170, 40, 30, 5));
    Approx.bounds(Bounds.fromBbox([170, -30, 175, 40]), new Bounds(170, -30, 5, 70));
    Approx.bounds(Bounds.fromBbox([-170, -40, -155, -30]), new Bounds(-170, -40, 15, 10));
  });

  it('scaleFromCenter', () => {
    const b = Bounds.fromBbox([170, 40, 200, 45]);
    Approx.bounds(b.scaleFromCenter(1.2), new Bounds(167, 39.5, 36, 6));
    Approx.bounds(b.scaleFromCenter(0.5, 2), new Bounds(177.5, 37.5, 15, 10));
    Approx.bounds(b.scaleFromCenter(3, 0.25), new Bounds(140, 41.875, 90, 1.25));
  });

  it('pad', () => {
    const b = Bounds.fromBbox([170, 40, 200, 45]);
    assert.deepEqual(round(b.pad(1.2).toBbox()), [168.8, 38.8, 201.2, 46.2]);
    assert.deepEqual(round(b.pad(0.5, 2).toBbox()), [169.5, 38, 200.5, 47]);
    assert.deepEqual(round(b.pad(-2).toBbox()), [172, 42, 198, 43]);
  });

  it('intersects bounds', () => {
    assert.equal(tileZero.intersection(new Bounds(-10, -10, 10, 10)), null);
    assert.equal(tileZero.intersection(getTile(0, 1)), null);
    assert.equal(tileZero.intersection(getTile(1, 0)), null);
    assert.equal(tileZero.intersection(getTile(1, 1)), null);
    Approx.bounds(tileMiddle.intersection(getTile(0, 0)), new Bounds(128, 128, 128, 128));
    Approx.bounds(tileMiddle.intersection(getTile(1, 0)), new Bounds(256, 128, 128, 128));
    Approx.bounds(tileMiddle.intersection(getTile(1, 1)), new Bounds(256, 256, 128, 128));
    Approx.bounds(tileMiddle.intersection(getTile(0, 1)), new Bounds(128, 256, 128, 128));
  });

  it('union', () => {
    assert.deepEqual(new Bounds(5, 10, 6, 7).union(new Bounds(2, 12, 1, 3)).toJson(), new Bounds(2, 10, 9, 7).toJson());
    assert.deepEqual(new Bounds(5, 10, 6, 7).union(new Bounds(7, 2, 1, 3)).toJson(), new Bounds(5, 2, 6, 15).toJson());
    assert.deepEqual(
      new Bounds(5, 10, 6, 7).union(new Bounds(2, 2, 20, 20)).toJson(),
      new Bounds(2, 2, 20, 20).toJson(),
    );

    assert.deepEqual(
      new Bounds(2, 2, 20, 20).union(new Bounds(5, 10, 6, 7)).toJson(),
      new Bounds(2, 2, 20, 20).toJson(),
    );
  });

  it('static union', () => {
    assert.deepEqual(Bounds.union([new Bounds(2, 12, 10, 30), { x: 1, y: -2, width: 3, height: 10 }]).toJson(), {
      x: 1,
      y: -2,
      width: 11,
      height: 44,
    });
    assert.deepEqual(
      Bounds.union([
        new Bounds(2, 12, 10, 30),
        { x: 4, y: 30, width: 3, height: 10 },
        { x: 10, y: 20, width: 40, height: 50 },
      ]).toJson(),
      { x: 2, y: 12, width: 48, height: 58 },
    );
  });

  it('shift intersects', () => {
    assert.equal(tileZero.intersects(tileZero.subtract(tileZero)), true);
    assert.equal(tileZero.intersects(tileZero.add(tileZero).subtract(tileZero)), true);
    assert.equal(tileZero.intersects(tileZero.subtract(tileMiddle)), true);
    assert.equal(tileZero.intersects(tileZero.add(tileMiddle)), true);
  });

  it('containsBounds', () => {
    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 5.5, 0, 0)), true);

    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4, 5.5, 0, 0)), true);
    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 5, 0.2, 1)), true);
    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(5, 5.5, 0, 0)), true);
    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 6, 0, 0)), true);
    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4, 5, 1, 1)), true);

    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 6, 1, 0)), false);
    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 6, 0.5, 1.001)), false);

    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(3.9, 5.5, 0, 0)), false);
    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 6.1, 0, 0)), false);
    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(4.5, 4.9, 0, 0)), false);
    assert.equal(new Bounds(4, 5, 1, 1).containsBounds(new Bounds(5.1, 5.5, 0, 0)), false);
  });

  it('compareArea', () => {
    assert.equal(Bounds.compareArea(new Bounds(4, 5, 1, 1), new Bounds(4, 5, 1, 1)), 0);
    assert.equal(Bounds.compareArea(new Bounds(3, 5, 1, 1), new Bounds(4, 5, 1, 1)), -1);
    assert.equal(Bounds.compareArea(new Bounds(4, 5, 1, 1), new Bounds(4, 4, 1, 1)), 1);
    assert.equal(Bounds.compareArea(new Bounds(3, 5, 1, 1), new Bounds(3, 5, 2, 5)), -9);
  });

  it('fromMultiPolygon', () => {
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

    assert.deepEqual(Bounds.fromMultiPolygon(poly).toJson(), { x: 74, y: -57, width: 20, height: 18 });
  });

  it('toPolygon', () => {
    assert.deepEqual(new Bounds(74, -57, 20, 18).toPolygon(), [
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
