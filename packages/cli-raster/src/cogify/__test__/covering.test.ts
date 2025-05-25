import assert from 'node:assert';
import { describe, it } from 'node:test';

import { GoogleTms, QuadKey } from '@basemaps/geo';

import { gsdToMeter } from '../cli/cli.cover.js';
import { addChildren, addSurrounding } from '../covering/covering.js';

describe('getChildren', () => {
  it('should get children', () => {
    assert.deepEqual(addChildren({ z: 0, x: 0, y: 0 }), [
      { z: 1, x: 0, y: 0 },
      { z: 1, x: 1, y: 0 },
      { z: 1, x: 0, y: 1 },
      { z: 1, x: 1, y: 1 },
    ]);
  });

  ['', '3', '310', '013', '3100123', '3103123231312301'].map((qk) => {
    it('should match QuadKey: ' + qk, () => {
      const tileChildren = addChildren(QuadKey.toTile(qk));
      const qkChildren = QuadKey.children(qk).map((qk) => QuadKey.toTile(qk));
      assert.deepEqual(tileChildren, qkChildren);
    });
  });
});

describe('SurroundingTiles', () => {
  it('should not have surrounding tiles at z0', () => {
    const todo = addSurrounding({ z: 0, x: 0, y: 0 }, GoogleTms);
    assert.deepEqual(todo, []);
  });

  it('should add all surrounding tiles', () => {
    assert.deepEqual(addSurrounding({ z: 2, x: 1, y: 1 }, GoogleTms), [
      { z: 2, x: 1, y: 0 },
      { z: 2, x: 2, y: 1 },
      { z: 2, x: 1, y: 2 },
      { z: 2, x: 0, y: 1 },
    ]);
  });

  it('should wrap at matrix extent', () => {
    // Top left tile
    assert.deepEqual(addSurrounding({ z: 2, x: 0, y: 0 }, GoogleTms), [
      { z: 2, x: 0, y: 3 }, // North - Wrapping North to South
      { z: 2, x: 1, y: 0 }, // East
      { z: 2, x: 0, y: 1 }, // South
      { z: 2, x: 3, y: 0 }, // West - Wrapping West to East
    ]);

    // Bottom right tile
    assert.deepEqual(addSurrounding({ z: 2, x: 3, y: 3 }, GoogleTms), [
      { z: 2, x: 3, y: 2 }, // North
      { z: 2, x: 0, y: 3 }, // East -- Wrapping East to West
      { z: 2, x: 3, y: 0 }, // South -- Wrapping South to NOrth
      { z: 2, x: 2, y: 3 }, // West
    ]);
  });

  describe('gsdToMeter', () => {
    it('Should convert gsd to correct meter', () => {
      assert.equal(gsdToMeter(1), 1);
      assert.equal(gsdToMeter(305.223), 305);
      assert.equal(gsdToMeter(8.01), 8);
      assert.equal(gsdToMeter(0.1), 0.1);
      assert.equal(gsdToMeter(0.1001), 0.1);
      assert.equal(gsdToMeter(0.2005), 0.201);
      assert.equal(gsdToMeter(0.0005), 0.001);
    });
  });
});
