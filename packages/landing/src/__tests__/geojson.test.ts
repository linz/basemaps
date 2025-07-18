import assert from 'node:assert';
import { describe, it } from 'node:test';

import { GoogleTms, Nztm2000QuadTms, projectGeoJson, Projection } from '@basemaps/geo';

/** This feature is located in tile x:237, y:278, z:9 of NZTM2000Quad see ./NZTMTileLocation.png for a reference picture  */
const feature = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [170.18596414439156, -45.25562110152719],
            [170.18756263742395, -45.223254647413995],
            [170.21809624631874, -45.22400303710795],
            [170.21651505261318, -45.25637033158635],
            [170.18596414439156, -45.25562110152719],
          ],
        ],
      },
      properties: {
        name: '/dunedin_rural_2013_0.40m_RGBA/CC16_5000_0704.tif',
      },
      bbox: [170.18596414439156, -45.25562110152719, 170.21809624631874, -45.22400303710795],
    },
  ],
};

describe('GeoJSONTransform', () => {
  it('should convert to the right tile location', () => {
    const newFeatures = JSON.parse(JSON.stringify(feature)) as GeoJSON.FeatureCollection;
    projectGeoJson(newFeatures, Nztm2000QuadTms);

    const firstPoint = (newFeatures.features[0] as GeoJSON.Feature<GeoJSON.Polygon>).geometry
      .coordinates[0][0] as number[];

    // find the target tile that will be used by this location
    const proj = Projection.get(GoogleTms).fromWgs84(firstPoint);
    const pixels = GoogleTms.sourceToPixels(proj[0], proj[1], 9);

    const tile = { x: pixels.x / GoogleTms.tileSize, y: pixels.y / GoogleTms.tileSize };

    assert.equal(tile.x.toFixed(2), '237.11');
    assert.equal(tile.y.toFixed(2), '278.69');
  });
});
