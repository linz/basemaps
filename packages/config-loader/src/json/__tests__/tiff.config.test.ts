import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { ConfigImagery } from '@basemaps/config';
import { fsa, FsMemory } from '@basemaps/shared';

import { isRgbOrRgba, loadStacFromURL } from '../tiff.config.js';

describe('loadStacFromURL', () => {
  const mem = new FsMemory();
  beforeEach(() => fsa.register('memory://', mem));
  afterEach(() => mem.files.clear());
  it('should load a json document', async () => {
    await mem.write(new URL('memory://foo/imagery/collection.json'), JSON.stringify({ hello: 'world' }));

    const result = await loadStacFromURL(new URL('memory://foo/imagery/'));
    assert.deepEqual(result as unknown, { hello: 'world' });
  });

  it('should load from trailing slash', async () => {
    await mem.write(new URL('memory://foo/imagery/collection.json'), JSON.stringify({ hello: 'world' }));

    const result = await loadStacFromURL(new URL('memory://foo/imagery'));
    assert.deepEqual(result as unknown, { hello: 'world' });
  });

  it('should load from prefixes', async () => {
    await mem.write(new URL('memory://foo/collection.json'), JSON.stringify({ foo: 'bar' }));

    const result = await loadStacFromURL(new URL('memory://foo/imagery'));
    assert.deepEqual(result as unknown, { foo: 'bar' });
  });
  it('should prioritize loading from more specific locations', async () => {
    await mem.write(new URL('memory://foo/imagery/collection.json'), JSON.stringify({ hello: 'world' }));
    await mem.write(new URL('memory://foo/collection.json'), JSON.stringify({ hello: 'Bar' }));

    const result = await loadStacFromURL(new URL('memory://foo/imagery'));
    assert.deepEqual(result as unknown, { hello: 'world' });
  });
});

describe('isRgbOrRgba', () => {
  const uint8 = { type: 'uint', bits: 8 };
  it('should allow imagery with no band information', () => {
    assert.equal(isRgbOrRgba({} as ConfigImagery), true);
  });

  it('should allow 3 or 4 band imagery', () => {
    assert.equal(isRgbOrRgba({ bands: [uint8, uint8, uint8] } as ConfigImagery), true);
    assert.equal(isRgbOrRgba({ bands: [uint8, uint8, uint8, uint8] } as ConfigImagery), true);
  });

  it('should not allow 1,2,5,6 band imagery', () => {
    assert.equal(isRgbOrRgba({ bands: [uint8] } as ConfigImagery), false);
    assert.equal(isRgbOrRgba({ bands: [uint8, uint8] } as ConfigImagery), false);
    assert.equal(isRgbOrRgba({ bands: [uint8, uint8, uint8, uint8, uint8] } as ConfigImagery), false);
    assert.equal(isRgbOrRgba({ bands: [uint8, uint8, uint8, uint8, uint8, uint8] } as ConfigImagery), false);
  });

  it('should not allow float32 imagery', () => {
    assert.equal(isRgbOrRgba({ bands: [uint8, uint8, uint8, { type: 'float', bits: 32 }] } as ConfigImagery), false);
  });

  it('should not allow uint16', () => {
    assert.equal(isRgbOrRgba({ bands: [uint8, uint8, uint8, { type: 'uint', bits: 16 }] } as ConfigImagery), false);
  });
});
