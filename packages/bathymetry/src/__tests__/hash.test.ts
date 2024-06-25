import assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { Hash } from '../hash.js';

describe('hash', () => {
  it('hash', async () => {
    writeFileSync('./test-file', Buffer.from('I am a test file for hashing\n'));
    const ans = await Hash.hash('./test-file');
    assert.equal(ans, '122076427149ca45100f317f16821ef934885cc49352447ee64c9f5e9655c95c695e');
  });
});
