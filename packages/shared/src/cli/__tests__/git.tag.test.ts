import assert from 'node:assert';
import { describe, it } from 'node:test';

import { GitTag } from '../git.tag.js';

describe('git.tag', () => {
  it('format', () => {
    const ans = GitTag();
    assert.equal(/^v\d+\.\d+\.\d+(-\d+-g[0-9a-f]+)?$/.test(ans.version), true, `Got: ${ans.version}`);
    assert.equal(/^[0-9a-f]+$/.test(ans.hash), true, `Got: ${ans.hash}`);
  });
});
