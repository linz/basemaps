import assert from 'node:assert';
import { describe, it } from 'node:test';

import { standardizeLayerName } from '../name.convertor.js';
import { LayerNames } from './names.js';

describe('standardizeLayerName', () => {
  it('should remove _RGB and _RGBA', () => {
    assert.equal(standardizeLayerName('ōtorohanga_urban_2021_0-1m_RGB'), 'ōtorohanga-urban-2021-0.1m');
    assert.equal(standardizeLayerName('waimakariri_urban_2013-2014_0-075m_RGBA'), 'waimakariri-urban-2013-2014-0.075m');
  });

  it('should fix the gsd', () => {
    assert.equal(standardizeLayerName('nz_satellite_2020-2021_10m_RGB'), 'nz-satellite-2020-2021-10m');
    assert.equal(standardizeLayerName('nz_satellite_2020-2021_0-10m_RGB'), 'nz-satellite-2020-2021-0.1m');
  });

  it('should handle large gsd', () => {
    assert.equal(standardizeLayerName('gebco_2020_305-75m'), 'gebco-2020-305.75m');
  });

  it('should trim trailing 0s from gsd', () => {
    assert.equal(standardizeLayerName('gebco_2020_305-750m'), 'gebco-2020-305.75m');
  });

  it('should convert into full years', () => {
    assert.equal(standardizeLayerName('northland_rural_2014-16_0-4m'), 'northland-rural-2014-2016-0.4m');
  });

  it('should not have name collisions', () => {
    const layerNames = new Set(LayerNames.map((c) => c[0]));
    const afterNames = new Set();
    for (const [layerName] of LayerNames) {
      const standardName = standardizeLayerName(layerName);
      // if (afterNames.has(stdname)) console.error('Duplicate', stdname);
      afterNames.add(standardName);
    }
    // We have two duplicate names
    // bay-of-plenty-urban-2018-2019-0.1m
    // chatham-islands-digital-globe-2014-2019-0.5m
    assert.equal(layerNames.size, LayerNames.length - 2);
    // Duplicates should be duplicates still
    assert.equal(layerNames.size, afterNames.size);
  });
});
