import assert from 'node:assert';
import { describe, it } from 'node:test';

import { toQueryString } from '../url.js';

describe('toQueryString', () => {
  it('should create a  query string', () => {
    assert.equal(toQueryString({ api: 'foo' }), '?api=foo');
  });

  it('should not create empty query strings', () => {
    assert.equal(toQueryString({}), '');
    assert.equal(toQueryString({ api: undefined }), '');
    assert.equal(toQueryString({ api: null }), '');
  });

  it('should sort keys', () => {
    assert.equal(toQueryString({ z: 'z', a: 'a' }), '?a=a&z=z');
  });
});
