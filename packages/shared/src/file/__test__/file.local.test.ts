import { statSync, unlinkSync } from 'fs';
import o from 'ospec';
import path from 'path';
import url from 'url';
import { fsa } from '../index.js';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function rmF(path: string): void {
  try {
    unlinkSync(path);
  } catch (_err) {}
}

o.spec('file.local', () => {
  const jsonFilePath = __dirname + '/testing.json';
  const jsonFilePathGz = jsonFilePath + '.gz';

  o.afterEach(() => {
    rmF(jsonFilePathGz);
    rmF(jsonFilePath);
  });

  o('readJson writeJson gzip', async () => {
    try {
      await fsa.writeJson(jsonFilePathGz, { json: '1'.repeat(1000) });
      const ans = await fsa.readJson(jsonFilePathGz);
      o(statSync(jsonFilePathGz).size).equals(44);
      o(ans).deepEquals({ json: '1'.repeat(1000) });
    } catch (e) {
      console.log(e);
    }
  });

  o('readJson writeJson', async () => {
    await fsa.writeJson(jsonFilePath, { json: '1'.repeat(1000) });
    const ans = await fsa.readJson(jsonFilePath);
    o(statSync(jsonFilePath).size).equals(1016);
    o(ans).deepEquals({ json: '1'.repeat(1000) });
  });
});
