import assert from 'node:assert';
import { describe, it } from 'node:test';

import { GoogleTms, QuadKey } from '@basemaps/geo';

import { addChildren, addSurrounding } from '../covering.js';

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
      const qkChildren = QuadKey.children(qk).map(QuadKey.toTile);
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
});
