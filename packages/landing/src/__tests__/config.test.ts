import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Config } from '../config.js';

describe('Config', () => {
  it('should return the same api key', () => {
    const keyA = Config.ApiKey;
    assert.equal(keyA, Config.ApiKey);
  });
});
