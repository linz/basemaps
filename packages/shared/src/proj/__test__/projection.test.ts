import { EpsgCode } from '@basemaps/geo';
import { round } from '@basemaps/test/build/rounding.js';
import { bboxToPolygon } from '@linzjs/geojson';
import o from 'ospec';
import { Projection } from '../projection.js';
import { qkToNamedBounds } from './test.util.js';

o.spec('Projection', () => {
  const googleProj = Projection.get(EpsgCode.Google);
  const nztmProj = Projection.get(EpsgCode.Nztm2000);

  o('should convert to 2193', () => {
    if (nztmProj == null) {
      throw new Error('Failed to init proj:2193');
    }
    const output = nztmProj.toWgs84([1180000, 4758000]);
    o(round(output, 6)).deepEquals([167.454458, -47.197075]);

    const reverse = nztmProj.fromWgs84(output);
    o(round(reverse, 2)).deepEquals([1180000, 4758000]);
  });

  o('toGeoJson', () => {
    const geojson = googleProj.toGeoJson(qkToNamedBounds(['31', '33']));

    const { features } = geojson;

    o(features.length).equals(2);

    o(features[0].properties).deepEquals({ name: '2-3-2' });
    o(features[1].properties).deepEquals({ name: '2-3-3' });
    const { geometry } = features[0]!;
    const coords = geometry.type === 'Polygon' ? geometry.coordinates : null;
    o(round(coords![0], 8)).deepEquals([
      [90, -66.51326044],
      [90, 0],
      [180, 0],
      [180, -66.51326044],
      [90, -66.51326044],
    ]);
  });

  o.spec('boundsToGeoJsonFeature', () => {
    o('simple', () => {
      const ans = round(
        googleProj.boundsToGeoJsonFeature(
          {
            x: -19929885.00696367,
            y: 19871181.369240656,
            width: 48921.969810251147,
            height: 4891.969810251147,
          },
          { name: '13-22-33' },
        ),
      );

      o(ans).deepEquals({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-179.03320312, 84.92054529],
              [-179.03320312, 84.92443459],
              [-178.59372959, 84.92443459],
              [-178.59372959, 84.92054529],
              [-179.03320312, 84.92054529],
            ],
          ],
        },
        properties: { name: '13-22-33' },
        bbox: [-179.03320312, 84.92054529, -178.59372959, 84.92443459],
      });
    });

    o('crosses antimeridian', () => {
      const ans = round(
        nztmProj.boundsToGeoJsonFeature({ x: 1293760, y: 5412480, width: 1246880, height: 1146880 }, { name: '1-2-1' }),
        4,
      );

      o(ans).deepEquals({
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [169.3378, -41.3809],
                [180, -41.223],
                [180, -30.908],
                [169.7909, -31.0596],
                [169.3378, -41.3809],
              ],
            ],
            [
              [
                [-180, -41.223],
                [-175.8429, -40.8954],
                [-177.1978, -30.7264],
                [-180, -30.908],
                [-180, -41.223],
              ],
            ],
          ],
        },
        properties: { name: '1-2-1' },
        bbox: [169.3378, -41.3809, -177.1978, -30.7264],
      });
    });
  });

  o('projectMultipolygon', () => {
    const poly = [bboxToPolygon([18494091.86765497, -6051366.655280836, 19986142.659781612, -4016307.214216303])];

    o(googleProj.projectMultipolygon(poly, googleProj)).equals(poly);

    const ans = round(googleProj.projectMultipolygon(poly, nztmProj), 4);

    o(round(ans, 4)).deepEquals([
      [
        [
          [1084733.8967, 4698018.9435],
          [2090794.171, 4700144.6365],
          [2204979.5633, 6228860.047],
          [964788.1197, 6226878.2808],
          [1084733.8967, 4698018.9435],
        ],
      ],
    ]);
  });
});
