import assert from 'node:assert';
import { describe } from 'node:test';

import { zoomLevelsFromWmts } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';

import { createOverviewWmtsCapabilities } from '../overview.wmts.js';

// This test should really live in @basemaps/config, but all the WMTS generation logic does not live in @basemaps/config
describe('zoomLevelsFromWmts', () => {
  o('should extract zoom levels', () => {
    const wmts = createOverviewWmtsCapabilities(Nztm2000QuadTms, 10, 'Test Title');
    assert.deepEqual(zoomLevelsFromWmts(wmts, Nztm2000QuadTms), { minZoom: 0, maxZoom: 10 });
  });

  o('should include all zoom levels', () => {
    const wmts = createOverviewWmtsCapabilities(GoogleTms, GoogleTms.maxZoom, 'Test Title');
    assert.deepEqual(zoomLevelsFromWmts(wmts, GoogleTms), { minZoom: 0, maxZoom: GoogleTms.maxZoom });
  });
  o('should not extract zoom levels for wrong projection', () => {
    const wmts = createOverviewWmtsCapabilities(GoogleTms, 10, 'Test Title');
    assert.equal(zoomLevelsFromWmts(wmts, Nztm2000QuadTms), null);
  });

  o('should not return if zooms are invalid', () => {
    const wmts = createOverviewWmtsCapabilities(Nztm2000QuadTms, 0, 'Test Title');
    assert.equal(zoomLevelsFromWmts(wmts, Nztm2000QuadTms), null);
  });
});
