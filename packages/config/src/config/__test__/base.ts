import assert from 'node:assert';
import { describe, it } from 'node:test';

import { BaseConfigParser } from '../base.js';

describe('BaseConfig', () => {
  it('should parse a base config', () => {
    const obj = BaseConfigParser.parse({ id: 'foo', name: 'bar' });
    assert.deepEqual(obj, { id: 'ts_foo', name: 'bar' });
  });
});
