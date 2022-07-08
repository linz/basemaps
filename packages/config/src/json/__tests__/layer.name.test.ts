import o from 'ospec';
import { standardizeLayerName } from '../name.convertor.js';
import { LayerNames } from './names.js';

o.spec('standardizeLayerName', () => {
  o('should remove _RGB and _RGBA', () => {
    o(standardizeLayerName('ōtorohanga_urban_2021_0-1m_RGB')).equals('ōtorohanga-urban-2021-0.1m');
    o(standardizeLayerName('waimakariri_urban_2013-2014_0-075m_RGBA')).equals('waimakariri-urban-2013-2014-0.075m');
  });

  o('should fix the gsd', () => {
    o(standardizeLayerName('nz_satellite_2020-2021_10m_RGB')).equals('nz-satellite-2020-2021-10m');
    o(standardizeLayerName('nz_satellite_2020-2021_0-10m_RGB')).equals('nz-satellite-2020-2021-0.1m');
  });

  o('should handle large gsd', () => {
    o(standardizeLayerName('gebco_2020_305-75m')).equals('gebco-2020-305.75m');
  });

  o('should trim trailing 0s from gsd', () => {
    o(standardizeLayerName('gebco_2020_305-750m')).equals('gebco-2020-305.75m');
  });

  o('should convert into full years', () => {
    o(standardizeLayerName('northland_rural_2014-16_0-4m')).equals('northland-rural-2014-2016-0.4m');
  });

  o('should not have name collisions', () => {
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
    o(layerNames.size).equals(LayerNames.length - 2);
    // Duplicates should be duplicates still
    o(layerNames.size).equals(afterNames.size);
  });
});
