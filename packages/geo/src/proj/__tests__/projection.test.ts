import assert from 'node:assert';
import { describe, it } from 'node:test';

import { round } from '@basemaps/test/build/rounding.js';
import { bboxToPolygon } from '@linzjs/geojson';

import { Epsg, EpsgCode } from '../../epsg.js';
import { Projection } from '../projection.js';
import { qkToNamedBounds } from './test.util.js';

describe('Projection', () => {
  const googleProj = Projection.get(EpsgCode.Google);
  const nztmProj = Projection.get(EpsgCode.Nztm2000);

  it('should convert to 2193', () => {
    if (nztmProj == null) {
      throw new Error('Failed to init proj:2193');
    }
    const output = nztmProj.toWgs84([1180000, 4758000]);
    assert.deepEqual(round(output, 6), [167.454458, -47.197075]);

    const reverse = nztmProj.fromWgs84(output);
    assert.deepEqual(round(reverse, 2), [1180000, 4758000]);
  });

  it('tryGet should not throw if epsg is defined but projection is not', () => {
    const count = Epsg.Codes.size;
    const epsg = new Epsg(Math.random());

    assert.equal(Projection.tryGet(epsg), null);

    Epsg.Codes.delete(epsg.code);
    assert.equal(Epsg.Codes.size, count);
  });

  it('toGeoJson', () => {
    const geojson = googleProj.toGeoJson(qkToNamedBounds(['31', '33']));

    const { features } = geojson;

    assert.equal(features.length, 2);

    assert.deepEqual(features[0].properties, { name: '2-3-2' });
    assert.deepEqual(features[1].properties, { name: '2-3-3' });
    const { geometry } = features[0];
    const coords = geometry.type === 'Polygon' ? geometry.coordinates : null;
    assert.deepEqual(round(coords![0], 8), [
      [90, -66.51326044],
      [90, 0],
      [180, 0],
      [180, -66.51326044],
      [90, -66.51326044],
    ]);
  });

  describe('boundsToGeoJsonFeature', () => {
    it('simple', () => {
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

      assert.deepEqual(ans, {
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

    it('crosses antimeridian', () => {
      const ans = round(
        nztmProj.boundsToGeoJsonFeature({ x: 1293760, y: 5412480, width: 1246880, height: 1146880 }, { name: '1-2-1' }),
        4,
      );

      assert.deepEqual(ans, {
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

  it('projectMultipolygon', () => {
    const poly = [bboxToPolygon([18494091.86765497, -6051366.655280836, 19986142.659781612, -4016307.214216303])];

    assert.equal(googleProj.projectMultipolygon(poly, googleProj), poly);
    const projected = round(googleProj.projectMultipolygon(poly, nztmProj), 4);
    assert.equal(projected.length, 1);
    assert.equal(projected[0].length, 1);

    assert.deepEqual(projected[0][0][0], [1084733.8969, 4698018.9435]);
    assert.deepEqual(projected[0][0][1], [2090794.1708, 4700144.6365]);
    assert.deepEqual(projected[0][0][2], [2204979.5628, 6228860.047]);
    assert.deepEqual(projected[0][0][3], [964788.1204, 6226878.2808]);
    assert.deepEqual(projected[0][0][4], [1084733.8969, 4698018.9435]);
  });
});
