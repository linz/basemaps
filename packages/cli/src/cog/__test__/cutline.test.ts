import { EpsgCode } from '@basemaps/geo';
import { ProjectionTileMatrixSet } from '@basemaps/shared';
import { Approx } from '@basemaps/test';
import { round } from '@basemaps/test/build/rounding';
import { MultiPolygon } from 'geojson';
import o from 'ospec';
import { Cutline } from '../cutline';
import { SourceMetadata } from '../types';
import { SourceTiffTestHelper } from './source.tiff.testhelper';
import { qkToName } from '@basemaps/shared/build/tms/__test__/test.util';

o.spec('cutline', () => {
    const testDir = `${__dirname}/../../../__test.assets__`;
    const googleProj = ProjectionTileMatrixSet.get(EpsgCode.Google);
    const nztmProj = ProjectionTileMatrixSet.get(EpsgCode.Nztm2000);

    o.spec('filterSourcesForName', () => {
        o('fully within same projection', async () => {
            const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'), -100);

            const name = qkToName('311333222321113310');

            const job = SourceTiffTestHelper.makeCogJob();
            job.projection = EpsgCode.Google;
            job.source.projection = EpsgCode.Nztm2000;
            const sourceBounds = SourceTiffTestHelper.tiffNztmBounds(testDir);
            const [tif1, tif2] = sourceBounds;
            job.source.files = [tif1, tif2];

            cutline.filterSourcesForName(name, job);

            o(job.source.files).deepEquals([tif2]);
        });
    });

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
        const bounds = SourceTiffTestHelper.tiffNztmBounds();

        o(cutline.clipPoly.length).equals(2);

        (cutline as any).findCovering({ projection: EpsgCode.Nztm2000, bounds, resZoom: 15 });

        o((cutline as any).srcPoly.length).equals(1);
    });

    o.spec('optmize', async () => {
        const bounds = SourceTiffTestHelper.tiffNztmBounds();

        o('nztm', () => {
            const cutline = new Cutline(nztmProj);

            const covering = cutline.optimizeCovering({
                projection: EpsgCode.Nztm2000,
                bounds,
                resZoom: 14,
            } as SourceMetadata);

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

        o('source polygon is smoothed', async () => {
            const tiff1 = {
                name: '/path/to/tiff1.tiff',
                x: 1759315.9336568,
                y: 5476120.089572778,
                width: 2577.636033663526,
                height: 2275.3233966259286,
            };

            const tiff2 = {
                name: '/path/to/tiff2.tiff',
                x: 1759268.0010635862,
                y: 5473899.771969615,
                width: 2576.894309356343,
                height: 2275.3359155077487,
            };

            const bounds = [tiff1, tiff2];
            const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'), 500);

            const covering = cutline.optimizeCovering({
                projection: EpsgCode.Nztm2000,
                bounds,
                resZoom: 22,
            } as SourceMetadata);

            o(round(cutline.clipPoly, 4)).deepEquals([
                [
                    [
                        [19468580.0838, -4993280.8853],
                        [19471098.3762, -4993280.8853],
                        [19471932.5568, -4992600.0637],
                        [19472092.0139, -4992352.6943],
                        [19472092.0139, -4987203.6846],
                        [19471983.8261, -4987203.6846],
                        [19470978.4379, -4989417.4454],
                        [19468800.9775, -4991497.5405],
                        [19468580.0838, -4991792.2036],
                        [19468580.0838, -4993280.8853],
                    ],
                ],
            ]);

            o(covering.map((c) => c.name)).deepEquals([
                '14-16151-10232',
                '14-16151-10233',
                '14-16152-10231',
                '14-16152-10232',
                '14-16152-10233',
                '18-258444-163695',
            ]);
        });

        o('boundary part inland, part coastal', async () => {
            const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'), 500);
            const bounds = [
                {
                    name: 'tiff1',
                    x: 1759315.9336568,
                    y: 5476120.089572778,
                    width: 2577.636033663526,
                    height: 2275.3233966259286,
                },
            ];

            const covering = cutline.optimizeCovering({
                projection: EpsgCode.Nztm2000,
                bounds,
                resZoom: 22,
            } as SourceMetadata);

            o(round(cutline.clipPoly, 4)).deepEquals([
                [
                    [
                        [19470015.7313, -4990337.1045],
                        [19472091.9684, -4990337.1045],
                        [19472091.9684, -4987203.6846],
                        [19471983.8261, -4987203.6846],
                        [19470978.4379, -4989417.4454],
                        [19470015.7313, -4990337.1045],
                    ],
                ],
            ]);

            o(covering.map((c) => c.name)).deepEquals([
                '14-16152-10231',
                '15-32304-20464',
                '15-32305-20464',
                '18-258444-163695',
            ]);
        });

        o('low res', () => {
            const cutline = new Cutline(googleProj);

            const covering = cutline.optimizeCovering({
                projection: EpsgCode.Nztm2000,
                bounds,
                resZoom: 13,
            } as SourceMetadata);

            o(covering.length).equals(covering.length);
            o(covering.map((c) => c.name)).deepEquals(['8-252-159', '8-252-160']);
        });

        o('hi res', () => {
            const covering2 = new Cutline(googleProj).optimizeCovering({
                projection: EpsgCode.Nztm2000,
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
