import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ConfigId } from '../base.config.js';
import { ConfigPrefix } from '../config/prefix.js';

describe('ConfigPrefix', () => {
  it('should prefix values', () => {
    assert.equal(ConfigId.prefix(ConfigPrefix.TileSet, '123'), 'ts_123');
    assert.equal(ConfigId.prefix(ConfigPrefix.Imagery, '123'), 'im_123');
  });

  it('should unprefix values', () => {
    assert.equal(ConfigId.unprefix(ConfigPrefix.TileSet, 'ts_123'), '123');
    assert.equal(ConfigId.unprefix(ConfigPrefix.Imagery, 'im_123'), '123');
  });

  it('should not unprefix unknown values', () => {
    assert.equal(ConfigId.unprefix(ConfigPrefix.TileSet, 'im_123'), 'im_123');
    assert.equal(ConfigId.unprefix(ConfigPrefix.Imagery, 'ts_123'), 'ts_123');
  });

  it('should get prefix values', () => {
    assert.equal(ConfigId.getPrefix('ts_123'), ConfigPrefix.TileSet);
    assert.equal(ConfigId.getPrefix('im_123'), ConfigPrefix.Imagery);
  });

  it('should not return unknown prefixes', () => {
    assert.equal(ConfigId.getPrefix('jj_123'), null);
    assert.equal(ConfigId.getPrefix('123'), null);
    assert.equal(ConfigId.getPrefix('_123'), null);
    assert.equal(ConfigId.getPrefix('123_123'), null);
  });
});
