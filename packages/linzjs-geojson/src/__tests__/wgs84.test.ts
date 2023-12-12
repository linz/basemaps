import assert from 'node:assert';
import { describe, it } from 'node:test';

import { round } from '@basemaps/test/build/rounding.js';

import { BBox, Ring } from '../types.js';
import { Wgs84 } from '../wgs84.js';

describe('wgs84', () => {
  it('normLon', () => {
    assert.equal(round(Wgs84.normLon(-163.12345 - 720)), -163.12345);
    assert.equal(round(Wgs84.normLon(-183.12345 - 720)), 176.87655);
    assert.equal(round(Wgs84.normLon(-163.12345)), -163.12345);
    assert.equal(round(Wgs84.normLon(184.12345)), -175.87655);
    assert.equal(round(Wgs84.normLon(184.12345 + 720)), -175.87655);
    assert.equal(round(Wgs84.normLon(174.12345 + 720)), 174.12345);
  });

  it('crossesAM', () => {
    assert.equal(Wgs84.crossesAM(-5, 5), false);
    assert.equal(Wgs84.crossesAM(80, -100), false);
    assert.equal(Wgs84.crossesAM(-175, 175), true);
    assert.equal(Wgs84.crossesAM(175, -175), true);
  });

  it('delta', () => {
    assert.equal(Wgs84.delta(170, -175), 15);
    assert.equal(Wgs84.delta(-175, 170), -15);

    assert.equal(Wgs84.delta(20, 30), 10);
    assert.equal(Wgs84.delta(30, 20), -10);

    assert.equal(Wgs84.delta(-10, 20), 30);
    assert.equal(Wgs84.delta(20, -10), -30);
  });

  it('union', () => {
    const across: BBox = [175, -42, -178, -41];
    const after: BBox = [-170, -43, -160, -42];
    const before1: BBox = [170, 40, 178, 42];
    const before2: BBox = [160, 43, 171, 46];

    assert.deepEqual(round(Wgs84.union(across, after), 4), [175, -43, -160, -41]);
    assert.deepEqual(round(Wgs84.union(after, across), 4), [175, -43, -160, -41]);
    assert.deepEqual(round(Wgs84.union(before1, before2), 4), [160, 40, 178, 46]);

    const unionLon = (aw: number, ae: number, bw: number, be: number): number[] =>
      round(Wgs84.union([aw, -42, ae, -40], [bw, -42, be, -40]), 4);

    // disjoint east closer
    assert.deepEqual(unionLon(90, 100, -100, -90), [90, -42, -90, -40]);
    // disjoint west closer
    assert.deepEqual(unionLon(80, 90, -90, -80), [-90, -42, 90, -40]);
  });

  it('intersects', () => {
    assert.equal(
      Wgs84.intersects(
        [171.16132716263337, -41.92299193831797, 179.6866432373672, -36.636815652203964],
        [-179.99999999999963, -85.05112877980652, 179.9999999999992, 85.05112877980656],
      ),
      true,
    );

    assert.equal(
      Wgs84.intersects(
        [-179.99999999999963, -85.05112877980652, 179.9999999999992, 85.05112877980656],
        [-172.0800290863167, -48.5745837865672, -153.8906979748706, -38.00169088003005],
      ),
      true,
    );

    assert.equal(
      Wgs84.intersects(
        [-172.0800290863167, -48.5745837865672, -153.8906979748706, -38.00169088003005],
        [-179.99999999999963, -85.05112877980652, 179.9999999999992, 85.05112877980656],
      ),
      true,
    );

    assert.equal(Wgs84.intersects([10, -10, 20, 10], [10, -10, 20, 10]), true);
    assert.equal(Wgs84.intersects([10, -10, 20, 10], [10, 11, 20, 20]), false);
    assert.equal(Wgs84.intersects([10, -10, 20, 10], [30, -10, 40, 10]), false);
    assert.equal(Wgs84.intersects([10, -10, 20, 10], [0, -10, 40, 10]), true);
    assert.equal(Wgs84.intersects([170, -10, -120, 10], [-150, -10, -120, 10]), true);
    assert.equal(Wgs84.intersects([170, -10, -170, 10], [-160, -10, -120, 10]), false);

    assert.equal(Wgs84.intersects([-150, -10, -120, 10], [170, -10, -120, 10]), true);
    assert.equal(Wgs84.intersects([-160, -10, -120, 10], [170, -10, -170, 10]), false);
  });

  it('ringToBbox', () => {
    const ring: Ring = [
      [170, -41],
      [-175, -40],
      [-177, -42],
      [175, -42],
      [170, -41],
    ];
    assert.deepEqual(Wgs84.ringToBbox(ring), [170, -42, -175, -40]);
  });

  it('multiPolygonToBbox', () => {
    const ring1: Ring = [
      [170, -41],
      [160, -42],
      [170, -42],
      [170, -41],
    ];
    const ring2: Ring = [
      [-150, -40],
      [-140, -41],
      [-150, -41],
      [-150, -40],
    ];
    assert.deepEqual(Wgs84.multiPolygonToBbox([[ring1], [ring2]]), [160, -42, -140, -40]);
  });

  it('bboxToMultiPolygon', () => {
    assert.deepEqual(Wgs84.bboxToMultiPolygon([160, -42, 178, -40]), [
      [
        [
          [160, -42],
          [160, -40],
          [178, -40],
          [178, -42],
          [160, -42],
        ],
      ],
    ]);
    assert.deepEqual(Wgs84.bboxToMultiPolygon([160, -42, -140, -40]), [
      [
        [
          [160, -42],
          [160, -40],
          [180, -40],
          [180, -42],
          [160, -42],
        ],
      ],
      [
        [
          [-140, -40],
          [-140, -42],
          [-180, -42],
          [-180, -40],
          [-140, -40],
        ],
      ],
    ]);
  });
});
