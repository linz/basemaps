import assert from 'node:assert';
import { describe, it } from 'node:test';

import { QuadKey } from '../quad.key.js';

describe('QuadKey', () => {
  describe('intersect', () => {
    it('should intersect big to small', () => {
      assert.equal(QuadKey.intersects('', '30003303'), true);

      assert.equal(QuadKey.intersects('3', '30'), true);
      assert.equal(QuadKey.intersects('3', '301'), true);
      assert.equal(QuadKey.intersects('3', '333'), true);
      assert.equal(QuadKey.intersects('33', '30'), false);
      assert.equal(QuadKey.intersects('33', '301'), false);
      assert.equal(QuadKey.intersects('33', '333'), true);
    });

    it('should not intersect other cells', () => {
      assert.equal(QuadKey.intersects('0', '30003303'), false);
      assert.equal(QuadKey.intersects('1', '30003303'), false);
      assert.equal(QuadKey.intersects('2', '30003303'), false);
      assert.equal(QuadKey.intersects('31', '30003303'), false);
    });

    it('should intersect small to big', () => {
      assert.equal(QuadKey.intersects('331', '3'), true);
      assert.equal(QuadKey.intersects('331', '30'), false);
      assert.equal(QuadKey.intersects('331', '301'), false);
      assert.equal(QuadKey.intersects('331', '333'), false);
    });
  });

  it('should get children', () => {
    assert.deepEqual(QuadKey.children(''), ['0', '1', '2', '3']);
    assert.deepEqual(QuadKey.children('3'), ['30', '31', '32', '33']);
    assert.deepEqual(QuadKey.children('3001'), ['30010', '30011', '30012', '30013']);
  });

  it('should find parent', () => {
    assert.equal(QuadKey.parent(''), '');
    assert.equal(QuadKey.parent('3'), '');
    assert.equal(QuadKey.parent('31'), '3');
    assert.equal(QuadKey.parent('3001'), '300');
  });

  it('compareKeys', () => {
    assert.equal(QuadKey.compareKeys('3201', '33'), 2);
    assert.equal(QuadKey.compareKeys('33', '3201'), -2);
    assert.equal(QuadKey.compareKeys('33', '33'), 0);
    assert.equal(QuadKey.compareKeys('31', '33'), -1);
    assert.equal(QuadKey.compareKeys('31', '22'), 1);
  });

  it('toTile', () => {
    assert.deepEqual(QuadKey.toTile(''), { x: 0, y: 0, z: 0 });
    assert.deepEqual(QuadKey.toTile('31'), { x: 3, y: 2, z: 2 });
    assert.deepEqual(QuadKey.toTile('31021'), { x: 25, y: 18, z: 5 });
  });

  it('fromTile', () => {
    assert.equal(QuadKey.fromTile({ x: 0, y: 0, z: 0 }), '');
    assert.equal(QuadKey.fromTile({ x: 0, y: 0, z: 32 }), '00000000000000000000000000000000');
    assert.equal(QuadKey.fromTile({ x: 3, y: 2, z: 2 }), '31');
    assert.equal(QuadKey.fromTile({ x: 25, y: 18, z: 5 }), '31021');

    assert.equal(QuadKey.fromTile({ x: 2 ** 24 - 1, y: 0, z: 24 }), '111111111111111111111111');
    assert.equal(QuadKey.fromTile({ x: 0, y: 2 ** 24 - 1, z: 24 }), '222222222222222222222222');
    assert.equal(QuadKey.fromTile({ x: 2 ** 24 - 1, y: 2 ** 24 - 1, z: 24 }), '333333333333333333333333');
  });
});
