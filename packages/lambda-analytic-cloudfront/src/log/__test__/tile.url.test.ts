import assert from 'node:assert';
import { describe, it } from 'node:test';

import { parseTileUrl } from '../tile.url.js';

describe('tile.url', () => {
  it('should parse tile requests', () => {
    assert.deepEqual(parseTileUrl(200, '/v1/tiles/aerial/NZTM2000Quad/16/32237/31326.jpeg'), {
      extension: 'jpeg',
      tileMatrix: 'NZTM2000Quad',
      tileMatrixId: 'NZTM2000Quad',
      tileSet: 'aerial',
      webMercatorZoom: 18,
      z: 16,
    });

    assert.deepEqual(parseTileUrl(200, '/v1/tiles/aerial/WebMercatorQuad/16/32237/31326.webp'), {
      extension: 'webp',
      tileMatrix: 'WebMercatorQuad',
      tileMatrixId: 'WebMercatorQuad',
      tileSet: 'aerial',
      webMercatorZoom: 16,
      z: 16,
    });
  });

  it('should parse tile matrix sets', () => {
    assert.deepEqual(parseTileUrl(200, '/v1/tiles/aerial/3857/1/1/1.webp'), {
      extension: 'webp',
      tileMatrix: '3857',
      tileMatrixId: 'WebMercatorQuad',
      tileSet: 'aerial',
      webMercatorZoom: 1,
      z: 1,
    });
    assert.deepEqual(parseTileUrl(200, '/v1/tiles/aerial/EPSG:3857/1/1/1.webp'), {
      extension: 'webp',
      tileMatrix: 'EPSG:3857',
      tileMatrixId: 'WebMercatorQuad',
      tileSet: 'aerial',
      webMercatorZoom: 1,
      z: 1,
    });
    assert.deepEqual(parseTileUrl(200, '/v1/tiles/topographic/2193/1/1/1.pbf'), {
      extension: 'pbf',
      tileMatrix: '2193',
      tileMatrixId: 'NZTM2000',
      tileSet: 'topographic',
      webMercatorZoom: 5,
      z: 1,
    });
  });
});
