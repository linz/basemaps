import assert from 'node:assert';
import { describe, it } from 'node:test';

import type { ConfigBundled } from '@basemaps/config';

import { findUnusedImagery, getReferencedLocations } from '../unused.imagery.js';

const bucket = new URL('s3://linz-basemaps/');

function file(
  path: string,
  size: number,
  lastModified = '2025-01-01T00:00:00.000Z',
): {
  url: URL;
  size: number;
  lastModified: string;
} {
  return { url: new URL(path, bucket), size, lastModified };
}

describe('getReferencedLocations', () => {
  it('should find imagery locations in the config', () => {
    const config = {
      imagery: [
        { id: 'im_a', uri: 's3://linz-basemaps/3857/new-zealand/01M2S6FPVNQJSA8XZAEQ70SFKM/' },
        { id: 'im_b', uri: 's3://nz-imagery/auckland/' },
      ],
    } as unknown as ConfigBundled;
    assert.deepEqual(
      [...getReferencedLocations(config, bucket)],
      ['s3://linz-basemaps/3857/new-zealand/01M2S6FPVNQJSA8XZAEQ70SFKM/'],
    );
  });
});

describe('findUnusedImagery', () => {
  const referenced = new Set(['s3://linz-basemaps/3857/new-zealand/01M2S6FPVNQJSA8XZAEQ70SFKM/']);

  it('should find unreferenced imports', () => {
    const unused = findUnusedImagery(
      [
        file('3857/new-zealand/01M2S6FPVNQJSA8XZAEQ70SFKM/1-2-3.tiff', 100),
        file('3857/new-zealand/01K0R2M5VDTDZYPQH2EZNTERMR/1-2-3.tiff', 100),
        file('3857/new-zealand/01K0R2M5VDTDZYPQH2EZNTERMR/collection.json', 5, '2025-06-01T00:00:00.000Z'),
        file('3857/otago/01JTSJAKA13PJMMKJ2E880YF6A/1-2-3.tiff', 500),
      ],
      referenced,
    );
    assert.deepEqual(unused, [
      {
        location: 's3://linz-basemaps/3857/otago/01JTSJAKA13PJMMKJ2E880YF6A/',
        files: 1,
        size: 500,
        lastModified: '2025-01-01T00:00:00.000Z',
      },
      {
        location: 's3://linz-basemaps/3857/new-zealand/01K0R2M5VDTDZYPQH2EZNTERMR/',
        files: 2,
        size: 105,
        lastModified: '2025-06-01T00:00:00.000Z',
      },
    ]);
  });

  it('should keep sub folders of referenced imports', () => {
    const unused = findUnusedImagery(
      [file('3857/new-zealand/01M2S6FPVNQJSA8XZAEQ70SFKM/capture-area/area.geojson', 10)],
      referenced,
    );
    assert.deepEqual(unused, []);
  });
});
