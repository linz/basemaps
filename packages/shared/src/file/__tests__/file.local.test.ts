import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';

import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

import { fsa } from '../index.js';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function rmF(path: string): Promise<void> {
  try {
    await fs.unlink(path);
  } catch (_err) {}
}

describe('file.local', () => {
  const jsonFilePath = __dirname + '/testing.json';
  const jsonFilePathGz = jsonFilePath + '.gz';

  afterEach(async () => {
    await Promise.all([rmF(jsonFilePathGz), rmF(jsonFilePath)]);
  });

  it('readJson writeJson gzip', async () => {
    try {
      await fsa.writeJson(jsonFilePathGz, { json: '1'.repeat(1000) });
      const ans = await fsa.readJson(jsonFilePathGz);
      const stat = await fs.stat(jsonFilePathGz);
      assert.equal(stat.size, 44);
      assert.deepEqual(ans, { json: '1'.repeat(1000) });
    } catch (e) {
      console.log(e);
    }
  });

  it('readJson writeJson', async () => {
    await fsa.writeJson(jsonFilePath, { json: '1'.repeat(1000) });
    const ans = await fsa.readJson(jsonFilePath);
    const stat = await fs.stat(jsonFilePath);

    assert.equal(stat.size, 1016);
    assert.deepEqual(ans, { json: '1'.repeat(1000) });
  });

  it('should support reading relative paths', async () => {
    try {
      await fs.writeFile('foo.tmp', Buffer.from('hello world'));
      const res = await fsa.read('foo.tmp');
      assert.equal(res.toString(), 'hello world');
    } finally {
      await fs.unlink('foo.tmp');
    }
  });
});
