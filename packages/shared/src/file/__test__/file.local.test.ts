import { promises as fs } from 'fs';
import o from 'ospec';
import path from 'path';
import url from 'url';
import { fsa } from '../index.js';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function rmF(path: string): Promise<void> {
  try {
    await fs.unlink(path);
  } catch (_err) {}
}

o.spec('file.local', () => {
  const jsonFilePath = __dirname + '/testing.json';
  const jsonFilePathGz = jsonFilePath + '.gz';

  o.afterEach(async () => {
    await Promise.all([rmF(jsonFilePathGz), rmF(jsonFilePath)]);
  });

  o('readJson writeJson gzip', async () => {
    try {
      await fsa.writeJson(jsonFilePathGz, { json: '1'.repeat(1000) });
      const ans = await fsa.readJson(jsonFilePathGz);
      const stat = await fs.stat(jsonFilePathGz);
      o(stat.size).equals(44);
      o(ans).deepEquals({ json: '1'.repeat(1000) });
    } catch (e) {
      console.log(e);
    }
  });

  o('readJson writeJson', async () => {
    await fsa.writeJson(jsonFilePath, { json: '1'.repeat(1000) });
    const ans = await fsa.readJson(jsonFilePath);
    const stat = await fs.stat(jsonFilePath);

    o(stat.size).equals(1016);
    o(ans).deepEquals({ json: '1'.repeat(1000) });
  });

  o('should support reading relative paths', async () => {
    try {
      await fs.writeFile('foo.tmp', Buffer.from('hello world'));
      const res = await fsa.read('foo.tmp');
      o(res.toString()).equals('hello world');
    } finally {
      await fs.unlink('foo.tmp');
    }
  });
});
