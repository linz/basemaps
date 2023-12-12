import assert from 'node:assert';
import { describe, it } from 'node:test';

import { zoomLevelsFromWmts } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';

import { createOverviewWmtsCapabilities } from '../overview.wmts.js';

// This test should really live in @basemaps/config, but all the WMTS generation logic does not live in @basemaps/config
describe('zoomLevelsFromWmts', () => {
  it('should extract zoom levels', () => {
    const wmts = createOverviewWmtsCapabilities(Nztm2000QuadTms, 10, 'Test Title');
    assert.deepEqual(zoomLevelsFromWmts(wmts, Nztm2000QuadTms), { minZoom: 0, maxZoom: 10 });
  });

  it('should include all zoom levels', () => {
    const wmts = createOverviewWmtsCapabilities(GoogleTms, GoogleTms.maxZoom, 'Test Title');
    assert.deepEqual(zoomLevelsFromWmts(wmts, GoogleTms), { minZoom: 0, maxZoom: GoogleTms.maxZoom });
  });
  it('should not extract zoom levels for wrong projection', () => {
    const wmts = createOverviewWmtsCapabilities(GoogleTms, 10, 'Test Title');
    assert.equal(zoomLevelsFromWmts(wmts, Nztm2000QuadTms), null);
  });

  it('should not return if zooms are invalid', () => {
    const wmts = createOverviewWmtsCapabilities(Nztm2000QuadTms, 0, 'Test Title');
    assert.equal(zoomLevelsFromWmts(wmts, Nztm2000QuadTms), null);
  });
});
