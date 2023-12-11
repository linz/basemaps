import assert from 'node:assert';
import { describe, it } from 'node:test';

import { bboxContains, bboxToPolygon } from '../bbox.js';

describe('bbox', () => {
  it('bboxContains', () => {
    assert.equal(bboxContains([4, 4, 6, 6], [4, 4, 5, 5]), true);
    assert.equal(bboxContains([4, 4, 6, 6], [4, 4, 6, 6]), true);
    assert.equal(bboxContains([4, 4, 6, 6], [4.5, 4.5, 5.5, 5.5]), true);

    assert.equal(bboxContains([4, 4, 6, 6], [4.5, 4.5, 5.5, 6.5]), false);
    assert.equal(bboxContains([4, 4, 6, 6], [4.5, 4.5, 6.5, 5.5]), false);
    assert.equal(bboxContains([4, 4, 6, 6], [4.5, 3.5, 5.5, 5.5]), false);
    assert.equal(bboxContains([4, 4, 6, 6], [3.5, 4.5, 5.5, 5.5]), false);
  });

  it('bboxToPolygon', () => {
    assert.deepEqual(bboxToPolygon([74, -57, 94, -39]), [
      [
        [74, -57],
        [94, -57],
        [94, -39],
        [74, -39],
        [74, -57],
      ],
    ]);
  });
});
