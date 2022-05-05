import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import { Projection } from '@basemaps/shared/build/proj/projection.js';
import { BBoxFeatureCollection } from '@linzjs/geojson';
import o from 'ospec';
import { projectGeoJson } from '../tile.matrix.js';

/** This feautre is located in tile x:237, y:278, z:9 of NZTM2000Quad see ./NZTMTileLocation.png for a reference picture  */
const feature: BBoxFeatureCollection = {
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

o.spec('GeoJSONTransform', () => {
  o('should convert to the right tile location', () => {
    const newFeatures = JSON.parse(JSON.stringify(feature));
    projectGeoJson(newFeatures, Nztm2000QuadTms);

    const firstPoint = newFeatures.features[0].geometry.coordinates[0][0];

    // find the target tile that will be used by this location
    const proj = Projection.get(GoogleTms).fromWgs84(firstPoint);
    const pixels = GoogleTms.sourceToPixels(proj[0], proj[1], 9);

    const tile = {
      x: pixels.x / GoogleTms.tileSize,
      y: pixels.y / GoogleTms.tileSize,
      z: 9,
    };

    o(tile.x.toFixed(2)).equals('237.11');
    o(tile.y.toFixed(2)).equals('278.69');
    o(tile.z).equals(9);
  });
});
