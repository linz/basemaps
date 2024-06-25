import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isAllowedFile } from '../imagery.js';

describe('ImageryRoute', () => {
  it('should allow geojson and json files only', () => {
    assert.equal(isAllowedFile('foo.geojson'), true);
    assert.equal(isAllowedFile('foo.json'), true);
    assert.equal(isAllowedFile('foo.tiff'), false);
    assert.equal(isAllowedFile('foo'), false);
    assert.equal(isAllowedFile(''), false);
    assert.equal(isAllowedFile(null as unknown as string), false);
  });
});
