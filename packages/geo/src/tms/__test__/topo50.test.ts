import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Topo50Tile, Topo50Tms } from '../topo50.js';
import { Topo50Data } from './topo50.data.js';

describe('topo50', () => {
  it('should create tiles', () => {
    // Top left + one to the right
    const tlRight = Topo50Tms.tileToSource({ x: 1, y: 0, z: 0 });
    assert.deepEqual(tlRight, { x: 988000 + 24_000, y: 6882000 });

    // Top left + one down
    const tlDown = Topo50Tms.tileToSource({ x: 0, y: 1, z: 0 });
    assert.deepEqual(tlDown, { x: 988000, y: 6882000 - 36_000 });

    const bottomRight = Topo50Tms.tileToSource({ x: 64, y: 64, z: 0 });
    assert.deepEqual(bottomRight, { x: 2524000, y: 4578000 });
  });

  it('should create bounds', () => {
    const boundsTl = Topo50Tms.tileToSourceBounds({ x: 0, y: 0, z: 0 });
    assert.deepEqual(boundsTl.toJson(), { x: 988000, y: 6846000, width: 24000, height: 36000 });

    const boundTlRight = Topo50Tms.tileToSourceBounds({ x: 1, y: 0, z: 0 });
    assert.deepEqual(boundTlRight.toJson(), { x: 988000 + 24_000, y: 6846000, width: 24000, height: 36000 });

    const boundTlDown = Topo50Tms.tileToSourceBounds({ x: 0, y: 1, z: 0 });
    assert.deepEqual(boundTlDown.toJson(), { x: 988000, y: 6846000 - 36_000, width: 24000, height: 36000 });
  });

  it('should convert to sheet codes', () => {
    const bq31 = Topo50Tile.toSheetCode({ x: 31, y: 40, z: 0 });
    assert.equal(bq31, 'BQ31');
    assert.deepEqual(Topo50Tile.fromSheetCode(bq31), { x: 31, y: 40, z: 0 });

    const bq31_10k = Topo50Tile.toSheetCode({ x: 31 * 5, y: 40 * 5, z: 1 });
    assert.equal(bq31_10k, 'BQ31');

    const bq31_5k = Topo50Tile.toSheetCode({ x: 31 * 10, y: 40 * 10, z: 2 });
    assert.equal(bq31_5k, 'BQ31');

    const bq31_1k = Topo50Tile.toSheetCode({ x: 31 * 50, y: 40 * 50, z: 3 });
    assert.equal(bq31_1k, 'BQ31');

    const tileNameOne = Topo50Tile.toSheetCode({ x: 0, y: 0, z: 1 });
    assert.equal(tileNameOne, 'AA00');
  });

  it('should convert sheets into Tiles and then into names', () => {
    for (const sheet of Topo50Data) {
      const pt = Topo50Tms.sourceToPixels(sheet.x, sheet.y, 0);
      const tile = Topo50Tms.pixelsToTile(pt.x, pt.y, 0);
      assert.equal(sheet.code, Topo50Tile.toSheetCode(tile));
    }
  });

  it('should convert from sheet code to location', () => {
    for (const sheet of Topo50Data) {
      const tile = Topo50Tile.fromSheetCode(sheet.code);
      const pt = Topo50Tms.tileToSource(tile);

      assert.equal(sheet.x, pt.x);
      assert.equal(sheet.y, pt.y);
    }
  });

  it('should create tile names per scale', () => {
    const bq31_10k = Topo50Tile.toName({ x: 31 * 5 + 0, y: 40 * 5 + 0, z: 1 });
    assert.equal(bq31_10k, 'BQ31_10000_0101');

    const BQ31_10000_0102 = Topo50Tile.toName({ x: 31 * 5 + 1, y: 40 * 5 + 0, z: 1 });
    assert.equal(BQ31_10000_0102, 'BQ31_10000_0102');

    const BQ31_10000_0201 = Topo50Tile.toName({ x: 31 * 5 + 0, y: 40 * 5 + 1, z: 1 });
    assert.equal(BQ31_10000_0201, 'BQ31_10000_0201');
  });

  it('should convert from codes', () => {
    assert.deepEqual(Topo50Tile.fromSheetCode('AA00'), { x: 0, y: 0, z: 0 });
    assert.deepEqual(Topo50Tile.fromSheetCode('AS21'), { x: 21, y: 18, z: 0 });
    assert.deepEqual(Topo50Tile.fromSheetCode('BG33'), { x: 33, y: 32, z: 0 });
    assert.deepEqual(Topo50Tile.fromSheetCode('BW14'), { x: 14, y: 46, z: 0 });
  });
  it('should throw if sheet codes are invalid', () => {
    assert.throws(() => Topo50Tile.fromSheetCode(''));
    assert.throws(() => Topo50Tile.fromSheetCode('A21'));
    assert.throws(() => Topo50Tile.fromSheetCode('AA211'));
    assert.throws(() => Topo50Tile.fromSheetCode('AAAA'));
    assert.throws(() => Topo50Tile.fromSheetCode('21AA'));
    assert.throws(() => Topo50Tile.fromSheetCode('AA2A'));
    assert.throws(() => Topo50Tile.fromSheetCode('AA0b'));
  });
});
