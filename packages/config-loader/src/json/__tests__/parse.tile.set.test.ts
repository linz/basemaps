import assert from 'node:assert';
import { describe, it } from 'node:test';

import { zTileSetConfig } from '../parse.tile.set.js';

describe('parse tile set', () => {
  it('should parse a basic tileset', () => {
    const ret = zTileSetConfig.safeParse({
      type: 'raster',
      id: 'basic-tileset',
      title: 'Basic Tiles Set',
      layers: [],
    });

    assert.equal(ret.success, true);
  });

  it('should fail with invalid zoom levels', () => {
    const ret = zTileSetConfig.safeParse({
      type: 'raster',
      id: 'invalid-zoom-tileset',
      title: 'Invalid Zoom Tiles Set',
      layers: [
        {
          minZoom: -1,
          maxZoom: 33,
          name: 'layer-1',
          title: 'Layer 1',
        },
      ],
    });

    assert.equal(ret.success, false);
    assert.deepEqual(ret.error?.errors, [
      {
        code: 'custom',
        message: 'must be between 0 and 32',
        path: ['layers', 0, 'minZoom'],
      },
      {
        code: 'custom',
        message: 'must be between 0 and 32',
        path: ['layers', 0, 'maxZoom'],
      },
    ]);
  });

  it('should fail with duplicate ouput names', () => {
    const ret = zTileSetConfig.safeParse({
      type: 'raster',
      id: 'duplicate-output-names',
      title: 'Duplicate Output Names',
      layers: [],
      outputs: [
        { name: 'output-1', title: 'Output 1', default: true },
        { name: 'output-1', title: 'Output 1 Duplicate', default: true },
      ],
    });

    assert.equal(ret.success, false);
    assert.deepEqual(ret.error?.errors, [
      {
        code: 'custom',
        message: 'Duplicate output name "output-1"',
        path: ['outputs', 1, 'name'],
      },
      {
        code: 'custom',
        message: 'Duplicate default outputs "output-1"',
        path: ['outputs', 1, 'default'],
      },
    ]);
  });
});
