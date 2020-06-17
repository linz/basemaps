import { EpsgCode, GeoJson } from '@basemaps/geo';
import { ProjectionTileMatrixSet } from '@basemaps/shared';
import { Approx } from '@basemaps/test';
import { round } from '@basemaps/test/build/rounding';
import { MultiPolygon } from 'geojson';
import * as o from 'ospec';
import { Cutline } from '../cutline';
import { SourceMetadata } from '../types';
import { SourceTiffTestHelper } from './source.tiff.testhelper';

o.spec('cutline', () => {
    const testDir = `${__dirname}/../../../__test.assets__`;
    const googleProj = ProjectionTileMatrixSet.get(EpsgCode.Google);

    o('loadCutline', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/mana.geojson'));
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
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/mana.geojson'));
        const feature = SourceTiffTestHelper.makeTiffFeatureCollection();

        o(cutline.clipPoly.length).equals(2);

        const result = (cutline as any).findCovering({ bounds: feature, resZoom: 15 });

        o(result.length).equals(1);
    });

    o.spec('optmize', async () => {
        const bounds = SourceTiffTestHelper.makeTiffFeatureCollection();

        o('nztm', () => {
            const proj = ProjectionTileMatrixSet.get(EpsgCode.Nztm2000);

            const cutline = new Cutline(proj);

            const covering = cutline.optimizeCovering({ bounds, resZoom: 14 } as SourceMetadata);

            o(covering.length).equals(covering.length);
            o(covering[4]).deepEquals({
                name: '7-153-253',
                x: 1741760,
                y: 5448320,
                width: 17920,
                height: 17920,
            });
            o(covering.map((c) => c.name)).deepEquals([
                '7-152-252',
                '7-152-253',
                '7-152-254',
                '7-153-252',
                '7-153-253',
                '7-153-254',
                '7-154-252',
                '7-154-253',
                '7-154-254',
                '7-155-252',
                '7-155-253',
                '8-387-635',
            ]);
        });

        o('boundary part inland, part coastal', async () => {
            const poly = GeoJson.toPositionPolygon([174.89, -40.83, 174.92, -40.85]);

            const bounds = SourceTiffTestHelper.makeTiffFeatureCollection(poly);
            const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'), 500);

            const covering = cutline.optimizeCovering({ bounds, resZoom: 22 } as SourceMetadata);

            o(round(cutline.clipPoly, 4)).deepEquals([
                [
                    [
                        [19470094.8286, -4990261.5441],
                        [19472027.7232, -4990261.5441],
                        [19472027.7232, -4987279.214],
                        [19471949.5241, -4987279.214],
                        [19470978.4379, -4989417.4454],
                        [19470094.8286, -4990261.5441],
                    ],
                ],
            ]);

            o(covering.map((c) => c.name)).deepEquals([
                '14-16152-10231',
                '15-32304-20464',
                '15-32305-20464',
                '17-129222-81847',
            ]);
        });

        o('low res', () => {
            const cutline = new Cutline(googleProj);

            const covering = cutline.optimizeCovering({ bounds, resZoom: 13 } as SourceMetadata);

            o(covering.length).equals(covering.length);
            o(covering.map((c) => c.name)).deepEquals(['8-252-159', '8-252-160']);
        });

        o('hi res', () => {
            const covering2 = new Cutline(googleProj).optimizeCovering({
                bounds,
                resZoom: 18,
            } as SourceMetadata);

            o(covering2.length).equals(covering2.length);

            o(covering2.map((c) => c.name)).deepEquals([
                '10-1008-639',
                '10-1008-640',
                '10-1009-639',
                '10-1009-640',
                '11-2020-1279',
                '11-2020-1280',
                '12-4040-2557',
                '12-4040-2562',
            ]);
        });
    });
});
