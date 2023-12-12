import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Env } from '../const.js';

describe('Environment', () => {
  it('should load a number from environment var', () => {
    process.env[Env.TiffConcurrency] = '5';
    assert.equal(Env.getNumber(Env.TiffConcurrency, -1), 5);
  });

  it('should default from environment var', () => {
    delete process.env[Env.TiffConcurrency];
    assert.equal(Env.getNumber(Env.TiffConcurrency, -1), -1);
  });
});
