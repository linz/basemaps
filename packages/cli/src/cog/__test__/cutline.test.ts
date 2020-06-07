import { EpsgCode, QuadKey } from '@basemaps/geo';
import { ProjectionTileMatrixSet } from '@basemaps/shared';
import { Approx } from '@basemaps/test';
import { MultiPolygon } from 'geojson';
import * as o from 'ospec';
import { Cutline } from '../cutline';
import { SourceMetadata } from '../types';
import { SourceTiffTestHelper } from './source.tiff.testhelper';

o.spec('cutline', () => {
    const testDir = `${__dirname}/../../../__test.assets__`;

    const proj = ProjectionTileMatrixSet.get(EpsgCode.Google);
    o('loadCutline', async () => {
        const cutline = new Cutline(proj, await Cutline.loadCutline(testDir + '/mana.geojson'));
        const geojson = cutline.toGeoJson();
        const mp = geojson.features[0].geometry as MultiPolygon;
        const { coordinates } = mp;
        mp.coordinates = [];
        o(geojson).deepEquals({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [],
                    },
                    properties: {},
                },
            ],
        });
        o(coordinates.length).equals(2);
        const [lon, lat] = coordinates[0][0][0];
        Approx.latLon({ lon, lat }, { lon: 174.781349356, lat: -41.077634319 });
    });

    o('findCovering', async () => {
        const cutline = new Cutline(proj, await Cutline.loadCutline(testDir + '/mana.geojson'));
        const feature = SourceTiffTestHelper.makeTiffFeatureCollection();

        o(cutline.polygons.length).equals(2);

        const result = (cutline as any).findCovering(feature, cutline.polygons);

        o(result.length).equals(1);
    });

    o.spec('optmize', async () => {
        const geoJson = SourceTiffTestHelper.makeTiffFeatureCollection();

        o('nztm', () => {
            const proj = ProjectionTileMatrixSet.get(EpsgCode.Nztm2000);

            const cutline = new Cutline(proj);

            const covering = cutline.optimizeCovering({ bounds: geoJson, resZoom: 14 } as SourceMetadata);

            o(covering.length).equals(Array.from(covering).length);
            o(Array.from(covering)).deepEquals([
                '032233200',
                '032233201',
                '032233202',
                '032233203',
                '032233210',
                '032233211',
                '032233212',
                '032233213',
                '032233220',
                '032233221',
                '032233230',
                '032233231',
            ]);
        });

        o('low res', () => {
            const cutline = new Cutline(proj);

            const covering = cutline.optimizeCovering({ bounds: geoJson, resZoom: 13 } as SourceMetadata);

            o(covering.length).equals(Array.from(covering).length);
            o(Array.from(covering)).deepEquals(['31133322', '31311100']);
        });

        o('hi res', () => {
            const covering2 = new Cutline(proj).optimizeCovering({
                bounds: geoJson,
                resZoom: 18,
            } as SourceMetadata);

            o(covering2.length).equals(Array.from(covering2).length);

            o(Array.from(covering2)).deepEquals(
                [
                    '3113332222',
                    '3113332223',
                    '311333223202',
                    '31133322322',
                    '3131110000',
                    '3131110001',
                    '31311100100',
                    '313111001020',
                ].sort(QuadKey.compareKeys),
            );
        });
    });

    o('optimize should not cover the world', () => {
        const bounds = proj.toGeoJson(['']);
        const cutline = new Cutline(proj);
        const covering = cutline.optimizeCovering({ bounds, resZoom: 0 } as SourceMetadata);
        o(Array.from(covering)).deepEquals(['0', '1', '2', '3']);
    });
});
