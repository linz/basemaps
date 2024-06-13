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

  it('should slug the bearing and pitch', () => {
    assert.equal(
      LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8, bearing: 25.3, pitch: -35.722 }),
      `@-41.2778480,174.7763921,z8,b25.3,p-36`,
    );
    assert.deepEqual(LocationSlug.fromSlug(`@-41.2778480,174.7763921,z8,b25.3,p-35.722`), {
      lat: -41.277848,
      lon: 174.7763921,
      zoom: 8,
      bearing: 25.3,
      pitch: -35.722,
    });
  });

  it('should slug the bearing only when pitch is 0', () => {
    assert.equal(
      LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8, bearing: 25.3 }),
      `@-41.2778480,174.7763921,z8,b25.3`,
    );
    assert.deepEqual(LocationSlug.fromSlug(`@-41.2778480,174.7763921,z8,b25.3`), {
      lat: -41.277848,
      lon: 174.7763921,
      zoom: 8,
      bearing: 25.3,
    });
  });

  it('should slug the pitch only bearing pitch is 0', () => {
    assert.equal(
      LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8, pitch: -0.01 }),
      `@-41.2778480,174.7763921,z8`,
    );
    assert.deepEqual(LocationSlug.fromSlug(`@-41.2778480,174.7763921,z8,p-0.01`), {
      lat: -41.277848,
      lon: 174.7763921,
      zoom: 8,
      pitch: -0.01,
    });
  });

  const lonLatZoom = { lat: -41.277848, lon: 174.7763921, zoom: 8 };

  it('should fail if bearing is outside of bounds', () => {
    assert.deepEqual(LocationSlug.fromSlug('@-41.2778480,174.7763921,z8,b360'), { ...lonLatZoom, bearing: 360 });
    assert.deepEqual(LocationSlug.fromSlug('@-41.2778480,174.7763921,z8,b360.01'), lonLatZoom);
    assert.deepEqual(LocationSlug.fromSlug('@-41.2778480,174.7763921,z8,b-0.00001'), lonLatZoom);
  });

  it('should fail if pitch is outside of bounds', () => {
    assert.deepEqual(LocationSlug.fromSlug('@-41.2778480,174.7763921,z8,p35'), { ...lonLatZoom, pitch: 35 });
    assert.deepEqual(LocationSlug.fromSlug('@-41.2778480,174.7763921,z8,p-80.1'), lonLatZoom);
    assert.deepEqual(LocationSlug.fromSlug('@-41.2778480,174.7763921,z8,p81'), lonLatZoom);
  });

  it('toSlug should truncate bearing and pitch', () => {
    assert.equal(
      LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8, pitch: -0.9 }),
      `@-41.2778480,174.7763921,z8,p-1`,
    );
    assert.equal(
      LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8, pitch: 0.4 }),
      `@-41.2778480,174.7763921,z8`,
    );
    assert.equal(
      LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8, pitch: 0.4, bearing: 0.09 }),
      `@-41.2778480,174.7763921,z8,b0.1`,
    );
    assert.equal(
      LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8, pitch: 0.4, bearing: 0.04 }),
      `@-41.2778480,174.7763921,z8`,
    );
  });
});
