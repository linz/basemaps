import assert from 'node:assert';
import { describe } from 'node:test';

import { GdalProgressParser } from '../gdal.progress.js';

describe('GdalProgressParser', () => {
  o('should emit on progress', () => {
    const prog = new GdalProgressParser();
    assert.equal(prog.progress, 0);

    prog.data(Buffer.from('\n.'));
    assert.equal(prog.progress.toFixed(2), '3.23');
  });

  o('should take 31 dots to finish', () => {
    const prog = new GdalProgressParser();
    let processCount = 0;
    prog.data(Buffer.from('\n'));
    prog.on('progress', () => processCount++);

    for (let i = 0; i < 31; i++) {
      prog.data(Buffer.from('.'));
      assert.equal(processCount, i + 1);
    }
    assert.equal(prog.progress.toFixed(2), '100.00');
  });
});
