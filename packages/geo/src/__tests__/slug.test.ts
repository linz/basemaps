import assert from 'node:assert';
import { describe, it } from 'node:test';

import { LocationSlug } from '../slug.js';

describe('LocationUrl', () => {
  it('should encode lon lat', () => {
    assert.equal(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 8 }), `@-41.2778481,174.7763921,z8`);
    assert.equal(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 10 }), `@-41.2778481,174.7763921,z10`);
    assert.equal(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 18 }), `@-41.2778481,174.7763921,z18`);
    assert.equal(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 20 }), `@-41.2778481,174.7763921,z20`);
    assert.equal(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 22 }), `@-41.2778481,174.7763921,z22`);

    // Common floating point fun
    assert.equal(LocationSlug.toSlug({ lat: 0.1 + 0.2, lon: -41.2778481, zoom: 22 }), `@0.3000000,-41.2778481,z22`);
  });

  it('should work from screenshot examples', () => {
    assert.deepEqual(LocationSlug.fromSlug('#@-41.2890657,174.7769262,z16'), {
      lat: -41.2890657,
      lon: 174.7769262,
      zoom: 16,
    });
  });

  it('should round trip', () => {
    assert.equal(LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8 }), `@-41.2778480,174.7763921,z8`);
    assert.deepEqual(LocationSlug.fromSlug(`@-41.2778480,174.7763921,z8`), {
      lat: -41.277848,
      lon: 174.7763921,
      zoom: 8,
    });
  });

  it('should fail if zoom is outside of bounds', () => {
    assert.notEqual(LocationSlug.fromSlug('@-41.27785,174.77639,z0'), null);

    assert.equal(LocationSlug.fromSlug('@-41.27785,174.77639,z-1'), null);
    assert.equal(LocationSlug.fromSlug('@-41.27785,174.77639,z33'), null);
  });

  it('should fail if lat is outside of bounds', () => {
    assert.notEqual(LocationSlug.fromSlug('@-41.27785,174.77639,z1'), null);

    assert.equal(LocationSlug.fromSlug('@-141.27785,174.77639,z1'), null);
    assert.equal(LocationSlug.fromSlug('@141.27785,174.77639,z1'), null);
  });

  it('should fail if lon is outside of bounds', () => {
    assert.notEqual(LocationSlug.fromSlug('@-41.27785,174.77639,z1'), null);
    assert.equal(LocationSlug.fromSlug('@-41.27785,274.77639,z1'), null);
    assert.equal(LocationSlug.fromSlug('@-41.27785,-274.77639,z1'), null);
  });
});
